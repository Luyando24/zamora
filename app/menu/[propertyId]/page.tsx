import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import MenuStorefront from '@/components/guest/MenuStorefront';

// Force dynamic rendering to ensure menu is always up-to-date
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MenuPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ propertyId: string }>,
  searchParams: Promise<{ room?: string }>
}) {
  const { propertyId } = await params;
  const { room } = await searchParams;

  // 1. Fetch Property Details (Use Admin to bypass RLS for guests)
  const adminSupabase = getSupabaseAdmin();
  const { data: property } = await adminSupabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (!property) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Property not found</div>;

  // 2. Fetch Menu Items (Linked to this property via menu_item_properties)
  // We use !inner join to ensure we only get items that are assigned to this property
  const { data: menuItems } = await adminSupabase
    .from('menu_items')
    .select('*, menu_item_properties!inner(property_id)')
    .eq('menu_item_properties.property_id', propertyId)
    .eq('is_available', true);

  // 3. Extract Categories directly from Menu Items
  // This ensures we only show categories that actually have items, avoids duplicates, 
  // and prioritizes the actual data over the category definitions.
  const uniqueCategories = Array.from(new Set((menuItems || []).map((item: any) => item.category).filter(Boolean))).sort();

  // 4. Fetch Bar Menu Items
  const { data: barMenuItems } = await adminSupabase
    .from('bar_menu_items')
    .select('*, bar_menu_item_properties!inner(property_id)')
    .eq('bar_menu_item_properties.property_id', propertyId)
    .eq('is_available', true);

  // 5. Extract Bar Categories directly from Bar Menu Items
  const uniqueBarCategories = Array.from(new Set((barMenuItems || []).map((item: any) => item.category).filter(Boolean))).sort();

  return (
    <MenuStorefront
      property={property}
      menuItems={menuItems || []}
      categories={uniqueCategories}
      barMenuItems={barMenuItems || []}
      barCategories={uniqueBarCategories}
      roomNumber={room}
    />
  );
}
