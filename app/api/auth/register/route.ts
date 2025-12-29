import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { email, password, firstName, lastName, phone } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Sign up the user
        // The database trigger 'handle_new_user' will automatically create the profile
        // We pass first_name and last_name in data so the trigger can use them
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    role: 'user' // Default role for public app users
                }
            }
        });

        if (error) {
            console.error('Registration error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data.user) {
            return NextResponse.json({ error: 'Registration failed - no user returned' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                firstName,
                lastName,
                role: 'user'
            },
            session: data.session
        });

    } catch (error: any) {
        console.error('Registration internal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
