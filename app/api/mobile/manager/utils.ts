import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

function getSupabase(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: authHeader || '',
                },
            },
        }
    );
}

export async function verifyManagerAccess(req: NextRequest, propertyId: string) {
    if (!propertyId) {
        return { error: 'Property ID is required', status: 400 };
    }

    const supabase = getSupabase(req);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return { error: 'Unauthorized', status: 401 };
    }

    // Use Admin client to check profile/roles reliably
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
        .from('profiles')
        .select('role, property_id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return { error: 'Profile not found', status: 404 };
    }

    // Check Access
    // 1. If Manager: Must match property_id
    // 2. If Owner: Can access any property they own (we might need to check 'properties' table for ownership if not using property_id on profile)
    // For simplicity: If role is 'admin' or 'owner', we allow access (or check ownership).
    // If role is 'manager', we STRICTLY check property_id.

    if (profile.role === 'manager') {
        if (profile.property_id !== propertyId) {
            return { error: 'Forbidden: You do not have access to this property', status: 403 };
        }
    } else if (profile.role === 'owner' || profile.role === 'admin') {
        // Optional: Verify ownership. For now, we assume owners have access to requested property 
        // if they know the ID. In a strict app, we'd check `created_by` on the property.
        const { data: property } = await admin
            .from('properties')
            .select('created_by')
            .eq('id', propertyId)
            .single();
        
        if (property && property.created_by !== user.id && profile.role !== 'admin') {
             return { error: 'Forbidden: You do not own this property', status: 403 };
        }
    } else {
        return { error: 'Forbidden: Insufficient role', status: 403 };
    }

    return { success: true, user, profile };
}
