import { supabase } from '@/lib/supabase';
import PropertyStorefront from '@/components/guest/PropertyStorefront';

export async function generateStaticParams() {
  const { data: properties } = await supabase.from('properties').select('id');
  return properties?.map(({ id }) => ({ propertyId: id })) || [];
}

export default async function BookingPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;

  // 1. Fetch Property Details
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  // 2. Fetch Room Types
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('property_id', propertyId);

  // 3. Fetch Menu Items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_available', true);

  // 4. Fetch Menu Categories
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('name')
    .or(`property_id.eq.${propertyId},property_id.is.null`)
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
