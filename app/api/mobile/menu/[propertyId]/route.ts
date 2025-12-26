import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validate as isUuid } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = await createClient();
    const { propertyId } = params;

    let resolvedPropertyId = propertyId;

    // 1. Resolve Property ID (if slug provided)
    if (!isUuid(propertyId)) {
      const { data: property, error } = await supabase
        .from('public_properties')
        .select('id')
        .eq('slug', propertyId)
        .single();

      if (error || !property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      resolvedPropertyId = property.id;
    }

    // 2. Fetch Property Details (Basic)
    const { data: property, error: propError } = await supabase
      .from('public_properties')
      .select('*')
      .eq('id', resolvedPropertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // 3. Fetch Food Menu Items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*, menu_item_properties!inner(property_id)')
      .eq('menu_item_properties.property_id', resolvedPropertyId)
      .eq('is_available', true);

    if (menuError) {
      console.error('Menu Error:', menuError);
    }

    // 4. Fetch Bar Menu Items
    const { data: barMenuItems, error: barError } = await supabase
      .from('bar_menu_items')
      .select('*, bar_menu_item_properties!inner(property_id)')
      .eq('bar_menu_item_properties.property_id', resolvedPropertyId)
      .eq('is_available', true);

    if (barError) {
      console.error('Bar Error:', barError);
    }

    // 5. Extract Categories
    const foodCategories = await supabase
      .from('menu_categories')
      .select('name')
      .or(`created_by.eq.${property?.created_by},created_by.is.null`)
      .order('name');

    const barCategories = Array.from(new Set((barMenuItems || []).map((item: any) => item.category).filter(Boolean))).sort();

    return NextResponse.json({
      property,
      menuItems: menuItems || [],
      barMenuItems: barMenuItems || [],
      categories: foodCategories.data?.map(c => c.name) || [],
      barCategories
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
