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
    const { email, firstName, lastName, role, propertyId } = body;

    if (!email || !role || !propertyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify requester has access to this property and is an admin/manager
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role, property_id')
      .eq('id', user.id)
      .single();

    if (!requesterProfile || requesterProfile.property_id !== propertyId || !['admin', 'manager'].includes(requesterProfile.role)) {
       return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const adminClient = getSupabaseAdmin();

    // 1. Invite User
    const { data: authData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
            first_name: firstName,
            last_name: lastName,
            property_id: propertyId,
            role: role
        }
    });

    if (inviteError) {
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
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

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: any) {
    console.error('Invite error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
