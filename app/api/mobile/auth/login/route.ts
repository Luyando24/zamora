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
        let subscriptionStatus = {
            isTrialExpired: false,
            daysRemaining: 14,
            plan: 'trial',
            status: 'trial',
            licenseExpiresAt: null
        };

        if (profile.property_id) {
            const { data: property, error: propertyError } = await adminClient
                .from('properties')
                .select('id, name, type, logo_url, subscription_status, subscription_plan, trial_ends_at, license_expires_at, created_at')
                .eq('id', profile.property_id)
                .single();
            
            if (propertyError) {
                console.error('Property fetch error:', propertyError);
            } else {
                propertyData = {
                    id: property.id,
                    name: property.name,
                    type: property.type,
                    logo_url: property.logo_url
                };

                // Calculate subscription status
                const now = new Date();
                const trialEndsAt = property.trial_ends_at;
                const licenseExpiresAt = property.license_expires_at;
                const status = property.subscription_status;
                const plan = property.subscription_plan;
                
                subscriptionStatus.plan = plan;
                subscriptionStatus.status = status;
                subscriptionStatus.licenseExpiresAt = licenseExpiresAt;

                if (status === 'active_licensed' && licenseExpiresAt) {
                    const expires = new Date(licenseExpiresAt);
                    const diffTime = expires.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    subscriptionStatus.daysRemaining = Math.max(0, diffDays);
                    subscriptionStatus.isTrialExpired = diffDays <= 0 || status === 'suspended';
                } else if (plan === 'trial' || !plan || status === 'trial') {
                    const ends = trialEndsAt ? new Date(trialEndsAt) : new Date(new Date(property.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
                    
                    const diffTime = ends.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    subscriptionStatus.daysRemaining = Math.max(0, diffDays);
                    subscriptionStatus.isTrialExpired = diffDays <= 0 && status !== 'active_licensed';
                } else {
                    subscriptionStatus.isTrialExpired = status === 'suspended';
                    subscriptionStatus.daysRemaining = 365;
                }
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
                property: propertyData,
                subscription: subscriptionStatus
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
