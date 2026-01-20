import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, firstName, lastName, role, propertyId, password } = body;

    if (!email || !role || !propertyId || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify requester has access to this property and is an admin/manager
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role, property_id')
      .eq('id', user.id)
      .single();

    if (!requesterProfile) {
        // Fallback: Check if user is super_admin (which might not have a profile linked to this property directly but has access)
        const { data: superAdmin } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (superAdmin?.role !== 'super_admin') {
             return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
    } else if ((requesterProfile.property_id !== propertyId) && requesterProfile.role !== 'super_admin') {
         // Allow if property matches OR if super_admin
         return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const adminClient = getSupabaseAdmin();

    // 1. Create User directly
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email since admin is adding them
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            property_id: propertyId,
            role: role
        }
    });

    if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    // 2. Create/Update Profile
    const newUserId = authData.user.id;
    
    const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
            id: newUserId,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: role,
            property_id: propertyId,
            status: 'active'
        });

    if (profileError) {
         console.error('Error updating profile:', profileError);
    }

    // 3. Add to Property Staff (CRITICAL for RLS visibility)
    const { error: staffError } = await adminClient
        .from('property_staff')
        .upsert({
            property_id: propertyId,
            user_id: newUserId,
            role: role
        }, { onConflict: 'property_id,user_id' });

    if (staffError) {
         console.error('Error updating property_staff:', staffError);
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: any) {
    console.error('Invite error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
