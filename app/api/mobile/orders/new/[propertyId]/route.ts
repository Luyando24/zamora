import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const limit = 50;

    // Build query for Food Orders (Pending only)
    let foodQuery = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id, quantity, unit_price, total_price, item_name
        )
      `)
      .eq('property_id', propertyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Build query for Bar Orders (Pending only)
    let barQuery = supabaseAdmin
      .from('bar_orders')
      .select(`
        *,
        bar_order_items (
          id, quantity, unit_price, total_price, item_name
        )
      `)
      .eq('property_id', propertyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Execute in parallel
    const [foodRes, barRes] = await Promise.all([foodQuery, barQuery]);

    if (foodRes.error) throw foodRes.error;
    if (barRes.error) throw barRes.error;

    // Combine and Sort
    const foodOrders = (foodRes.data || []).map((o: any) => ({ ...o, type: 'food' }));
    const barOrders = (barRes.data || []).map((o: any) => ({ ...o, type: 'bar' }));

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
