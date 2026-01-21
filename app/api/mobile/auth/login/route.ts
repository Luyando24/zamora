import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (!user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        // Fetch user profile and property details using Admin client to bypass potential RLS issues
        // We fetch separately to avoid issues with joins/foreign keys
        const adminClient = getSupabaseAdmin();
        
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            return NextResponse.json({ 
                error: `User profile not found: ${profileError?.message || 'No profile data'}` 
            }, { status: 404 });
        }

        let propertyData = null;
        if (profile.property_id) {
            const { data: property, error: propertyError } = await adminClient
                .from('properties')
                .select('id, name, type, logo_url')
                .eq('id', profile.property_id)
                .single();
            
            if (propertyError) {
                console.error('Property fetch error:', propertyError);
                // We don't fail login if property fetch fails, just return null property
            } else {
                propertyData = property;
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: profile.role,
                firstName: profile.first_name,
                lastName: profile.last_name,
                propertyId: profile.property_id,
                property: propertyData
            },
            session: {
                access_token: (await supabase.auth.getSession()).data.session?.access_token,
                refresh_token: (await supabase.auth.getSession()).data.session?.refresh_token
            }
        });

    } catch (error: any) {
        console.error('Mobile login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
