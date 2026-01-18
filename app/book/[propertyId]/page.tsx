import { supabase } from '@/lib/supabase';
import ModernPropertyDetails from '@/components/guest/ModernPropertyDetails';
import { validate as isUuid } from 'uuid';
import { Metadata, ResolvingMetadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: Promise<{ propertyId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { propertyId } = await params;
  
  let propertyQuery = supabase.from('public_properties').select('*');
  if (isUuid(propertyId)) {
    propertyQuery = propertyQuery.eq('id', propertyId);
  } else {
    propertyQuery = propertyQuery.eq('slug', propertyId);
  }
  const { data: property } = await propertyQuery.single();

  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const description = property.description 
    ? property.description.substring(0, 155) + (property.description.length > 155 ? '...' : '')
    : `Book your stay at ${property.name} in ${property.city || 'Zambia'}. Best rates guaranteed on Zamora.`;

  return {
    title: `${property.name} - ${property.city || 'Zambia'} Accommodation`,
    description: description,
    openGraph: {
      title: `${property.name} | Book on Zamora`,
      description: description,
      images: property.cover_image_url ? [property.cover_image_url, ...previousImages] : previousImages,
    },
  };
}

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

  // 5. Fetch Bar Menu Items
  const { data: barMenuItems } = await supabase
    .from('bar_menu_items')
    .select('*, bar_menu_item_properties!inner(property_id)')
    .eq('bar_menu_item_properties.property_id', resolvedPropertyId)
    .eq('is_available', true);

  // 6. Fetch Bar Categories
  const uniqueBarCategories = Array.from(new Set((barMenuItems || []).map((item: any) => item.category).filter(Boolean))).sort();

  return (
    <ModernPropertyDetails
      property={property}
      roomTypes={roomTypes || []}
      menuItems={menuItems || []}
      categories={categories?.map(c => c.name) || []}
      barMenuItems={barMenuItems || []}
      barCategories={uniqueBarCategories}
    />
  );
}
