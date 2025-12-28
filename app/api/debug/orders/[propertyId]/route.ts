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
    const limit = 20;

    // Fetch raw food orders without complex filters
    const { data: foodOrders, error: foodError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (foodError) {
        return NextResponse.json({ error: 'Food Query Failed', details: foodError }, { status: 500 });
    }

    // Fetch raw bar orders
    const { data: barOrders, error: barError } = await supabaseAdmin
      .from('bar_orders')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (barError) {
        return NextResponse.json({ error: 'Bar Query Failed', details: barError }, { status: 500 });
    }

    return NextResponse.json({
      message: "DEBUG: Last 20 orders per table for this property",
      propertyId,
      foodOrders: foodOrders?.map(o => ({
          id: o.id,
          created_at: o.created_at,
          status: o.status,
          waiter_name: o.waiter_name,
          guest_room_number: o.guest_room_number,
          table_number: o.table_number,
          notes: o.notes
      })),
      barOrders: barOrders?.map(o => ({
          id: o.id,
          created_at: o.created_at,
          status: o.status,
          waiter_name: o.waiter_name,
          guest_room_number: o.guest_room_number,
          table_number: o.table_number,
          notes: o.notes
      }))
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
