import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { NextResponse } from 'next/server';
import { validate as isUuid } from 'uuid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { propertyId } = params;

    let resolvedPropertyId = propertyId;
    
    console.log(`[Mobile Menu] 🚀 Fetching for property: ${propertyId}`);

    // 1. Resolve Property ID (if slug provided)
    if (!isUuid(propertyId)) {
      const { data: property, error } = await supabase
        .from('public_properties')
        .select('id')
        .eq('slug', propertyId)
        .single();

      if (error || !property) {
        console.error('[Mobile Menu] Property slug lookup failed:', error);
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      resolvedPropertyId = property.id;
    }

    if (!resolvedPropertyId) {
      console.error('[Mobile Menu] ❌ Failed to resolve Property ID');
      return NextResponse.json({ error: 'Invalid Property ID' }, { status: 400 });
    }

    // 2. Fetch Property Details (Basic)
    // We use 'properties' table instead of 'public_properties' view to ensure we get 'created_by'
    // which is needed for fetching categories.
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', resolvedPropertyId)
      .single();

    if (propError || !property) {
      console.error('[Mobile Menu] Property details lookup failed:', propError);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // 3. Fetch Food Menu Items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*, menu_item_properties!inner(property_id)')
      .eq('menu_item_properties.property_id', resolvedPropertyId)
      .eq('is_available', true);

    if (menuError) {
      console.error('[Mobile Menu] Food menu fetch failed:', menuError);
    } else {
        console.log(`[Mobile Menu] Found ${menuItems?.length || 0} food items`);
    }

    // 4. Fetch Bar Menu Items
    const { data: barMenuItems, error: barError } = await supabase
      .from('bar_menu_items')
      .select('*, bar_menu_item_properties!inner(property_id)')
      .eq('bar_menu_item_properties.property_id', resolvedPropertyId)
      .eq('is_available', true);

    if (barError) {
      console.error('[Mobile Menu] Bar menu fetch failed:', barError);
    } else {
        console.log(`[Mobile Menu] Found ${barMenuItems?.length || 0} bar items`);
    }

    // 5. Extract Categories
    const foodCategories = await supabase
      .from('menu_categories')
      .select('name')
      .or(`created_by.eq.${property?.created_by},created_by.is.null`)
      .order('name');
      
    console.log(`[Mobile Menu] Found ${foodCategories.data?.length || 0} food categories`);

    const barCategories = Array.from(new Set((barMenuItems || []).map((item: any) => item.category).filter(Boolean))).sort();

    // Transform items to match mobile app expectations (image field)
    const formattedMenuItems = menuItems?.map(item => ({
      ...item,
      image: item.image_url || item.gallery_urls?.[0] || null
    }));

    const formattedBarMenuItems = barMenuItems?.map(item => ({
      ...item,
      image: item.image_url || null
    }));

    return NextResponse.json({
      property,
      menuItems: formattedMenuItems || [],
      barMenuItems: formattedBarMenuItems || [],
      categories: foodCategories.data?.map(c => c.name) || [],
      barCategories
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
