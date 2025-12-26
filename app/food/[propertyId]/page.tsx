import { supabase } from '@/lib/supabase';
import { validate as isUuid } from 'uuid';
import { notFound } from 'next/navigation';
import RestaurantDetails from '@/components/guest/RestaurantDetails';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Force re-render 2025-12-26
export default async function FoodPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;

  let propertyQuery = supabase
    .from('public_properties')
    .select('*');

  if (isUuid(propertyId)) {
    propertyQuery = propertyQuery.eq('id', propertyId);
  } else {
    propertyQuery = propertyQuery.eq('slug', propertyId);
  }

  // 1. Fetch Property Details
  const { data: property } = await propertyQuery.single();

  if (!property) return notFound();

  // If not a restaurant, maybe redirect? For now, we assume links are correct.
  // const isRestaurant = property.type === 'restaurant';

  const resolvedPropertyId = property.id;

  // 2. Fetch Food Menu Items (via Junction)
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*, menu_item_properties!inner(property_id)')
    .eq('menu_item_properties.property_id', resolvedPropertyId)
    .eq('is_available', true);

  // 3. Fetch Menu Categories
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('name')
    .or(`created_by.eq.${property?.created_by},created_by.is.null`)
    .order('name');

  // 4. Fetch Bar Menu Items
  const { data: barMenuItems } = await supabase
    .from('bar_menu_items')
    .select('*, bar_menu_item_properties!inner(property_id)')
    .eq('bar_menu_item_properties.property_id', resolvedPropertyId)
    .eq('is_available', true);

  // 5. Fetch Bar Categories
  const uniqueBarCategories = Array.from(new Set((barMenuItems || []).map((item: any) => item.category).filter(Boolean))).sort();

  return (
    <RestaurantDetails
      property={property}
      menuItems={menuItems || []}
      categories={categories?.map(c => c.name) || []}
      barMenuItems={barMenuItems || []}
      barCategories={uniqueBarCategories}
    />
  );
}
