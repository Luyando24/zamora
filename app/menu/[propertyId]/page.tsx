import { supabase } from '@/lib/supabase';
import MenuStorefront from '@/components/guest/MenuStorefront';

export async function generateStaticParams() {
  const { data: properties } = await supabase.from('properties').select('id');
  return properties?.map(({ id }) => ({ propertyId: id })) || [];
}

export default async function MenuPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ propertyId: string }>,
  searchParams: Promise<{ room?: string }>
}) {
  const { propertyId } = await params;
  const { room } = await searchParams;

  // 1. Fetch Property Details
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (!property) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Property not found</div>;

  // 2. Fetch Menu Items (Linked to this property via menu_item_properties)
  // We use !inner join to ensure we only get items that are assigned to this property
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*, menu_item_properties!inner(property_id)')
    .eq('menu_item_properties.property_id', propertyId)
    .eq('is_available', true);

  // 3. Fetch Menu Categories
  // Fetch categories owned by the user OR global categories (created_by is null)
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('name')
    .or(`created_by.eq.${property.created_by},created_by.is.null`)
    .order('name');

  return (
    <MenuStorefront
      property={property}
      menuItems={menuItems || []}
      categories={categories?.map(c => c.name) || []}
      roomNumber={room}
    />
  );
}
