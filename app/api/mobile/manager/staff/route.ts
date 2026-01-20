import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { verifyManagerAccess } from '../utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');

        if (!propertyId) return NextResponse.json({ error: 'Property ID required' }, { status: 400 });

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        const { data: staff, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, role, phone')
            .eq('property_id', propertyId)
            .in('role', ['waiter', 'manager', 'chef', 'bartender']) // List relevant staff roles
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ staff });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { propertyId, firstName, lastName, email, password, role, phone } = body;

        if (!propertyId || !email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const access = await verifyManagerAccess(req, propertyId);
        if (access.error || !access.user) return NextResponse.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });

        const supabase = getSupabaseAdmin();

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                property_id: propertyId,
                role: role
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // 2. Create Profile
        // Note: Trigger might create profile automatically on some setups. 
        // We should check if profile exists or upsert.
        // Assuming manual creation or update:
        
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                email,
                first_name: firstName,
                last_name: lastName,
                role,
                property_id: propertyId,
                phone
            });

        if (profileError) {
            // Rollback auth user if profile fails? 
            // Ideally yes, but for now just report error.
            console.error('Profile creation error:', profileError);
            return NextResponse.json({ error: 'User created but profile failed: ' + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: { ...authData.user, role, firstName, lastName } });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
