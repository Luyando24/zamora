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
      return NextResponse.json({ menuItems: [], barMenuItems: [] });
    }

    const propertyIds = properties.map(p => p.id);

    // Fetch Food Menu
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*, menu_item_properties!inner(property_id)')
      .in('menu_item_properties.property_id', propertyIds)
      .order('name');

    if (menuError) throw menuError;

    // Fetch Bar Menu
    const { data: barMenuItems, error: barError } = await supabase
      .from('bar_menu_items')
      .select('*, bar_menu_item_properties!inner(property_id)')
      .in('bar_menu_item_properties.property_id', propertyIds)
      .order('name');

    if (barError) throw barError;

    return NextResponse.json({
      menuItems: menuItems || [],
      barMenuItems: barMenuItems || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, type, isAvailable } = body; 
    // Type: 'food' or 'bar'

    if (!itemId || !type || isAvailable === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const table = type === 'bar' ? 'bar_menu_items' : 'menu_items';

    const { data, error } = await supabase
      .from(table)
      .update({ is_available: isAvailable })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
