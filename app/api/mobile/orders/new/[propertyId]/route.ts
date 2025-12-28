import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // e.g., "pending,preparing"
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const limit = 50;

    // Build query for Food Orders
    let foodQuery = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id, quantity, unit_price, total_price, item_name, notes,
          menu_items ( name )
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter for unassigned orders (submitted by customers via QR)
    // IMPORTANT: We check if waiter_name is NULL *OR* empty string
    foodQuery = foodQuery.or('waiter_name.is.null,waiter_name.eq.""');

    // Apply status filter or default to 'pending'
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      foodQuery = foodQuery.in('status', statusList);
    } else {
      foodQuery = foodQuery.eq('status', 'pending');
    }

    // Build query for Bar Orders
    let barQuery = supabaseAdmin
      .from('bar_orders')
      .select(`
        *,
        bar_order_items (
          id, quantity, unit_price, total_price, item_name, notes,
          bar_menu_items ( name )
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter for unassigned orders (submitted by customers via QR)
    // IMPORTANT: We check if waiter_name is NULL *OR* empty string
    barQuery = barQuery.or('waiter_name.is.null,waiter_name.eq.""');

    // Apply status filter or default to 'pending'
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      barQuery = barQuery.in('status', statusList);
    } else {
      barQuery = barQuery.eq('status', 'pending');
    }

    // Execute in parallel
    const [foodRes, barRes] = await Promise.all([foodQuery, barQuery]);

    if (foodRes.error) throw foodRes.error;
    if (barRes.error) throw barRes.error;

    // Helper to get table number (prefer new column, fallback to parsing)
    const getTableNumber = (order: any) => {
      if (order.table_number) return order.table_number;
      
      const location = order.guest_room_number || '';
      if (location.toLowerCase().startsWith('table ')) {
        return location.substring(6).trim();
      }
      return location;
    };

    // Helper to get waiter name (prefer new column, fallback to parsing notes)
    const getWaiterName = (order: any) => {
      if (order.waiter_name) return order.waiter_name;
      
      const notes = order.notes || '';
      const match = notes.match(/\(Waiter: (.*?)\)/);
      return match ? match[1] : '';
    };

    // Combine and Sort
    const foodOrders = (foodRes.data || []).map((o: any) => ({
      ...o,
      type: 'food',
      table_number: getTableNumber(o),
      waiter_name: getWaiterName(o),
      items: (o.order_items || []).map((i: any) => ({
        id: i.id,
        name: i.item_name || i.menu_items?.name || 'Unknown Item',
        quantity: i.quantity,
        price: i.unit_price,
        total_price: i.total_price,
        notes: i.notes
      }))
    }));

    const barOrders = (barRes.data || []).map((o: any) => ({
      ...o,
      type: 'bar',
      table_number: getTableNumber(o),
      waiter_name: getWaiterName(o),
      items: (o.bar_order_items || []).map((i: any) => ({
        id: i.id,
        name: i.item_name || i.bar_menu_items?.name || 'Unknown Item',
        quantity: i.quantity,
        price: i.unit_price,
        total_price: i.total_price,
        notes: i.notes
      }))
    }));

    const allOrders = [...foodOrders, ...barOrders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      orders: allOrders
    });

  } catch (error: any) {
    console.error('Get New Orders Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
