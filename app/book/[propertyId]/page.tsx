import { supabase } from '@/lib/supabase';
import PropertyStorefront from '@/components/guest/PropertyStorefront';
import { validate as isUuid } from 'uuid';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BookingPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;

  let propertyQuery = supabase
    .from('public_properties')
    .select('*');

  if (isUuid(propertyId)) {
    propertyQuery = propertyQuery.eq('id', propertyId);
  } else {
    // Assume it's a slug
    // Note: public_properties view might need to include slug if it doesn't already select * from properties
    // If public_properties is a view, we need to ensure it has the slug column.
    // Assuming 'public_properties' is a view that selects * from properties or specific columns.
    // If it selects *, it will have slug after migration.
    propertyQuery = propertyQuery.eq('slug', propertyId);
  }

  // 1. Fetch Property Details
  const { data: property } = await propertyQuery.single();

  if (!property) return <div className="min-h-screen flex items-center justify-center text-slate-500">Property not found</div>;

  const resolvedPropertyId = property.id;

  // 2. Fetch Room Types
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('property_id', resolvedPropertyId);

  // 3. Fetch Menu Items (via Junction)
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*, menu_item_properties!inner(property_id)')
    .eq('menu_item_properties.property_id', resolvedPropertyId)
    .eq('is_available', true);

  // 4. Fetch Menu Categories
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('name')
    .or(`created_by.eq.${property?.created_by},created_by.is.null`)
    .order('name');

  return (
    <PropertyStorefront
      property={property}
      roomTypes={roomTypes || []}
      menuItems={menuItems || []}
      categories={categories?.map(c => c.name) || []}
    />
  );
}
