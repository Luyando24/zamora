import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton Supabase Admin Client for server-side operations
 * Reuses connection to prevent connection pool exhaustion
 */

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    // Return existing instance if available
    if (supabaseAdminInstance) {
        return supabaseAdminInstance;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            'Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
        );
    }

    // Create new instance with optimized settings
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
        db: {
            schema: 'public',
        },
        global: {
            headers: {
                'X-Client-Info': 'zamora-admin-client',
            },
        },
    });

    return supabaseAdminInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetSupabaseAdmin(): void {
    supabaseAdminInstance = null;
}

/**
 * Check if admin client is initialized
 */
export function isAdminClientInitialized(): boolean {
    return supabaseAdminInstance !== null;
}

/**
 * Execute database operation with admin client
 * Includes automatic error logging
 */
export async function executeAsAdmin<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    context?: string
): Promise<T> {
    try {
        const admin = getSupabaseAdmin();
        return await operation(admin);
    } catch (error) {
        console.error(`Admin operation failed${context ? ` (${context})` : ''}:`, error);
        throw error;
    }
}
