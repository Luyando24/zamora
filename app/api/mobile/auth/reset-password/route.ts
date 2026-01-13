import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabase = await createClient();
        
        // The user will receive an email with a link to reset their password.
        // The link will redirect to the specified URL (e.g., a web page or deep link).
        // Ensure this URL is added to your Supabase project's Redirect URLs.
        const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'https://zamoraapp.com'}/auth/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (error) {
            console.error('Password reset error:', error);
            // Don't reveal if user exists or not for security, but Supabase might return error for rate limits
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'If an account exists with this email, a password reset link has been sent.' 
        });

    } catch (error: any) {
        console.error('Password reset internal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
