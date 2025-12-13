import { supabase } from '@/lib/supabase';
import PropertyStorefront from '@/components/guest/PropertyStorefront';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BookingPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;

  // 1. Fetch Property Details
  const { data: property } = await supabase
    .from('public_properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  // 2. Fetch Room Types
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('property_id', propertyId);

  // 3. Fetch Menu Items (via Junction)
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*, menu_item_properties!inner(property_id)')
    .eq('menu_item_properties.property_id', propertyId)
    .eq('is_available', true);

  // 4. Fetch Menu Categories
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('name')
    .or(`created_by.eq.${property?.created_by},created_by.is.null`)
    .order('name');

  if (!property) return <div className="min-h-screen flex items-center justify-center text-slate-500">Property not found</div>;

  return (
    <PropertyStorefront
      property={property}
      roomTypes={roomTypes || []}
      menuItems={menuItems || []}
      categories={categories?.map(c => c.name) || []}
    />
  );
}
