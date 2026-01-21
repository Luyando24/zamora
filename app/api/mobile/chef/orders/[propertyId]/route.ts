import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

function getSupabase(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authHeader = req.headers.get('Authorization');
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: authHeader || '',
            },
        },
    });
}

export async function GET(
    req: NextRequest,
    { params }: { params: { propertyId: string } }
) {
    try {
        const { propertyId } = params;

        // 1. Verify User
        const supabase = getSupabase(req);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify Role
        const admin = getSupabaseAdmin();
        const { data: profile } = await admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const allowedRoles = ['chef', 'manager', 'admin'];
        if (!allowedRoles.includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden: Chef access only' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending,preparing,ready';
        const limit = parseInt(searchParams.get('limit') || '50');

        // 3. Fetch Food Orders (Kitchen Dashboard primarily handles food)
        let query = admin
            .from('orders')
            .select(`
        *,
        order_items (
          id, quantity, unit_price, total_price, item_name, notes,
          menu_items ( name, image_url, description )
        )
      `)
            .eq('property_id', propertyId)
            .order('created_at', { ascending: true }) // Oldest first for kitchen
            .limit(limit);

        if (status) {
            const statuses = status.split(',').map(s => s.trim());
            query = query.in('status', statuses);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Helper to get waiter name
        const getWaiterName = (order: any) => {
            if (order.waiter_name) return order.waiter_name;
            const notes = order.notes || '';
            const match = notes.match(/\(Waiter: (.*?)\)/);
            return match ? match[1] : '';
        };

        // 4. Format
        const orders = (data || []).map(o => ({
            id: o.id,
            created_at: o.created_at,
            status: o.status,
            guest_name: o.guest_name,
            guest_room_number: o.guest_room_number,
            total_amount: o.total_amount,
            notes: o.notes,
            waiter_name: getWaiterName(o),
            order_items: (o.order_items || []).map((i: any) => ({
                id: i.id,
                name: i.menu_items?.name || i.item_name || 'Unknown',
                quantity: i.quantity,
                notes: i.notes,
                image: i.menu_items?.image_url
            }))
        }));

        return NextResponse.json({ success: true, orders });

    } catch (error: any) {
        console.error('Chef Orders Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
