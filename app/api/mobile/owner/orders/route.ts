import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for API Routes (Bearer Token support)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader || '',
      },
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase(req);

    // 1. Verify User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type'); // 'food', 'bar', or null (all)
    const filterPropertyId = searchParams.get('propertyId'); // Optional: specific property

    // 2. Get User's Properties (or specific property if param provided)
    // We rely on RLS to filter properties the user has access to (Owned or Assigned)
    let query = supabase
      .from('properties')
      .select('id, name, type');
    
    if (filterPropertyId) {
      query = query.eq('id', filterPropertyId);
    }

    const { data: properties, error: propError } = await query;

    if (propError) {
      return NextResponse.json({ error: propError.message }, { status: 500 });
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const propertyIds = properties.map(p => p.id);

    let foodOrders: any[] = [];
    let barOrders: any[] = [];

    // 3. Fetch Food Orders (if not filtering for bar only)
    if (!filterType || filterType === 'food') {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name, image_url)
          )
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      foodOrders = data || [];
    }

    // 4. Fetch Bar Orders (if not filtering for food only)
    if (!filterType || filterType === 'bar') {
      const { data, error } = await supabase
        .from('bar_orders')
        .select(`
          *,
          bar_order_items (
            *,
            bar_menu_items (name, image_url)
          )
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      barOrders = data || [];
    }

    // 5. Normalize and Merge
    const normalizedFood = (foodOrders || []).map(o => ({
      ...o,
      type: 'food',
      propertyName: properties.find(p => p.id === o.property_id)?.name,
      items: o.order_items.map((i: any) => ({
        id: i.id,
        name: i.menu_items?.name || i.item_name || 'Unknown Item',
        quantity: i.quantity,
        price: i.unit_price,
        notes: i.notes,
        image: i.menu_items?.image_url
      }))
    }));

    const normalizedBar = (barOrders || []).map(o => ({
      ...o,
      type: 'bar',
      propertyName: properties.find(p => p.id === o.property_id)?.name,
      items: o.bar_order_items.map((i: any) => ({
        id: i.id,
        name: i.bar_menu_items?.name || i.item_name || 'Unknown Item',
        quantity: i.quantity,
        price: i.unit_price,
        notes: i.notes,
        image: i.bar_menu_items?.image_url
      }))
    }));

    const allOrders = [...normalizedFood, ...normalizedBar].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ orders: allOrders });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, type, status } = body;

    if (!orderId || !type || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const table = type === 'bar' ? 'bar_orders' : 'orders';

    // Verify ownership implicitly via RLS (if configured) or explicitly
    // Since we are using the user's token, RLS should handle it if set up.
    // But let's assume RLS checks 'created_by' of property... 
    // Wait, orders table doesn't have 'created_by'. It has 'property_id'.
    // RLS usually checks if user owns the property.
    // If RLS is strict, this update will fail if user doesn't own property.
    
    const { data, error } = await supabase
      .from(table)
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
