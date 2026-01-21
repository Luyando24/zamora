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

        const allowedRoles = ['cashier', 'manager', 'admin'];
        if (!allowedRoles.includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pos_completed,cancelled';
        const limit = parseInt(searchParams.get('limit') || '50');

        // 3. Fetch Food Orders
        let foodQuery = admin
            .from('orders')
            .select(`
        *,
        order_items (
          id, quantity, unit_price, total_price, item_name, notes,
          menu_items ( name, image_url )
        )
      `)
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            const statuses = status.split(',').map(s => s.trim());
            foodQuery = foodQuery.in('status', statuses);
        }

        // 3.1 Fetch Bar Orders
        let barQuery = admin
            .from('bar_orders')
            .select(`
        *,
        bar_order_items (
          id, quantity, unit_price, total_price, item_name, notes,
          bar_menu_items ( name, image_url )
        )
      `)
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status) {
            const statuses = status.split(',').map(s => s.trim());
            barQuery = barQuery.in('status', statuses);
        }

        const [foodRes, barRes] = await Promise.all([foodQuery, barQuery]);

        if (foodRes.error) throw foodRes.error;
        if (barRes.error) throw barRes.error;

        // Helper to get table number
        const getTableNumber = (order: any) => {
            if (order.table_number) return order.table_number;
            const location = order.guest_room_number || '';
            if (location.toLowerCase().startsWith('table ')) {
                return location.substring(6).trim();
            }
            return location;
        };

        // Helper to get waiter name
        const getWaiterName = (order: any) => {
            if (order.waiter_name) return order.waiter_name;
            const notes = order.notes || '';
            const match = notes.match(/\(Waiter: (.*?)\)/);
            return match ? match[1] : '';
        };

        // 4. Format
        const foodOrders = (foodRes.data || []).map(o => ({
            ...o,
            type: 'food',
            table_number: getTableNumber(o),
            waiter_name: getWaiterName(o),
            items: (o.order_items || []).map((i: any) => ({
                id: i.id,
                name: i.menu_items?.name || i.item_name || 'Unknown',
                quantity: i.quantity,
                price: i.unit_price,
                total_price: i.total_price,
                notes: i.notes,
                image: i.menu_items?.image_url
            }))
        }));

        const barOrders = (barRes.data || []).map(o => ({
            ...o,
            type: 'bar',
            table_number: getTableNumber(o),
            waiter_name: getWaiterName(o),
            items: (o.bar_order_items || []).map((i: any) => ({
                id: i.id,
                name: i.bar_menu_items?.name || i.item_name || 'Unknown',
                quantity: i.quantity,
                price: i.unit_price,
                total_price: i.total_price,
                notes: i.notes,
                image: i.bar_menu_items?.image_url
            }))
        }));

        const allOrders = [...foodOrders, ...barOrders].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({ orders: allOrders.slice(0, limit) });

    } catch (error: any) {
        console.error('Cashier History Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
