import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

        // Fetch user profile and property details
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, properties(id, name, type, currency_symbol, logo_url)')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
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
                property: profile.properties
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
