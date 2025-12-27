import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get properties
    const { data: properties } = await supabase
      .from('properties')
      .select('id, name')
      .eq('created_by', user.id);

    if (!properties || properties.length === 0) {
      return NextResponse.json({ 
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0 
      });
    }

    const propertyIds = properties.map(p => p.id);

    // Get Today's Date Range (UTC for simplicity, or just recent orders)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // Fetch Stats (Food)
    const { data: foodOrders } = await supabase
      .from('orders')
      .select('status, total_amount')
      .in('property_id', propertyIds)
      .gte('created_at', todayStr);

    // Fetch Stats (Bar)
    const { data: barOrders } = await supabase
      .from('bar_orders')
      .select('status, total_amount')
      .in('property_id', propertyIds)
      .gte('created_at', todayStr);

    const allOrders = [...(foodOrders || []), ...(barOrders || [])];
    
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      totalRevenue,
      properties: properties.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
