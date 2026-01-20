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
        return NextResponse.json({ error: 'Forbidden: Cashier access only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // 3. Fetch Food Orders (NO BAR ORDERS)
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
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) {
        const statuses = status.split(',').map(s => s.trim());
        query = query.in('status', statuses);
    }

    const { data: orders, error: dbError } = await query;

    if (dbError) throw dbError;

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
    const formattedOrders = (orders || []).map(o => ({
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

    return NextResponse.json({ orders: formattedOrders });

  } catch (error: any) {
    console.error('Cashier Orders Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
