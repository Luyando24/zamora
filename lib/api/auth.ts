import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

/**
 * Authentication and authorization utilities for API routes
 */

export interface AuthUser {
    id: string;
    email: string;
    role?: string;
}

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
}

async function getSupabase(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        return createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: authHeader,
                    },
                },
            }
        );
    }
    return await createServerClient();
}

/**
 * Authenticate the request and return the user
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
    try {
        const supabase = await getSupabase(req);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return {
                success: false,
                error: 'Unauthorized - Invalid or missing authentication token'
            };
        }

        // Fetch user profile for role information
        // Try 'profiles' table first as it's the standard in this project
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email || '',
                role: profile?.role || 'user'
            }
        };
    } catch (error) {
        return {
            success: false,
            error: 'Authentication failed'
        };
    }
}

/**
 * Verify user has access to a specific hotel/property
 */
export async function authorizeHotelAccess(
    userId: string,
    propertyId: string
): Promise<{ authorized: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Check if user is the owner (creator) of the property
        const { data: property, error: propError } = await supabase
            .from('properties')
            .select('created_by')
            .eq('id', propertyId)
            .single();
        
        if (!propError && property && property.created_by === userId) {
            return { authorized: true };
        }

        // 2. Check if user is super_admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (profile?.role === 'super_admin') {
            return { authorized: true };
        }

        // 3. Check if user is assigned staff
        const { data: staff, error } = await supabase
            .from('property_staff')
            .select('id, role')
            .eq('user_id', userId)
            .eq('property_id', propertyId)
            .maybeSingle();

        if (error) {
            return { authorized: false, error: 'Database error checking authorization' };
        }

        if (!staff) {
            return { authorized: false, error: 'Access denied - User not associated with this property' };
        }

        return { authorized: true };
    } catch (error) {
        return { authorized: false, error: 'Authorization check failed' };
    }
}

/**
 * Require specific role for access
 */
export async function requireRole(
    userId: string,
    requiredRoles: string[]
): Promise<{ authorized: boolean; error?: string; role?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return { authorized: false, error: 'User profile not found' };
        }

        const userRole = profile.role || 'user';

        if (!requiredRoles.includes(userRole)) {
            return {
                authorized: false,
                error: `Access denied - Required role: ${requiredRoles.join(' or ')}`,
                role: userRole
            };
        }

        return { authorized: true, role: userRole };
    } catch (error) {
        return { authorized: false, error: 'Role check failed' };
    }
}

/**
 * Verify user owns or has access to a specific resource
 */
export async function verifyResourceOwnership(
    userId: string,
    resourceTable: string,
    resourceId: string,
    ownerField: string = 'user_id'
): Promise<{ authorized: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from(resourceTable)
            .select(ownerField)
            .eq('id', resourceId)
            .single();

        if (error) {
            return { authorized: false, error: 'Resource not found' };
        }

        if ((data as any)[ownerField] !== userId) {
            return { authorized: false, error: 'Access denied - You do not own this resource' };
        }

        return { authorized: true };
    } catch (error) {
        return { authorized: false, error: 'Ownership verification failed' };
    }
}

/**
 * Check if user can access a folio (either owns it or manages the hotel)
 */
export async function authorizeFolioAccess(
    userId: string,
    folioId: string
): Promise<{ authorized: boolean; error?: string }> {
    try {
        const supabase = getSupabaseAdmin();

        // Get folio with property information
        const { data: folio, error: folioError } = await supabase
            .from('folios')
            .select('property_id')
            .eq('id', folioId)
            .single();

        if (folioError || !folio) {
            return { authorized: false, error: 'Folio not found' };
        }

        // Check if user has access to this property
        return await authorizeHotelAccess(userId, folio.property_id);
    } catch (error) {
        return { authorized: false, error: 'Folio access check failed' };
    }
}

/**
 * Combined authentication and authorization middleware
 */
export async function authenticateAndAuthorize(
    req: NextRequest,
    options?: {
        requireHotelId?: string;
        requireRoles?: string[];
        requireFolioId?: string;
    }
): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
}> {
    // First, authenticate
    const authResult = await authenticateRequest(req);
    if (!authResult.success || !authResult.user) {
        return authResult;
    }

    const user = authResult.user;

    // Check role requirements
    if (options?.requireRoles) {
        const roleCheck = await requireRole(user.id, options.requireRoles);
        if (!roleCheck.authorized) {
            return { success: false, error: roleCheck.error };
        }
    }

    // Check hotel access
    if (options?.requireHotelId) {
        const hotelCheck = await authorizeHotelAccess(user.id, options.requireHotelId);
        if (!hotelCheck.authorized) {
            return { success: false, error: hotelCheck.error };
        }
    }

    // Check folio access
    if (options?.requireFolioId) {
        const folioCheck = await authorizeFolioAccess(user.id, options.requireFolioId);
        if (!folioCheck.authorized) {
            return { success: false, error: folioCheck.error };
        }
    }

    return { success: true, user };
}
