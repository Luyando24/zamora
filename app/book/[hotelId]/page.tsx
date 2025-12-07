import { supabase } from '@/lib/supabase';
import HotelStorefront from '@/components/guest/HotelStorefront';

export async function generateStaticParams() {
  const { data: hotels } = await supabase.from('hotels').select('id');
  return hotels?.map(({ id }) => ({ hotelId: id })) || [];
}

export default async function BookingPage({ params }: { params: { hotelId: string } }) {
  // 1. Fetch Hotel Details
  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', params.hotelId)
    .single();

  // 2. Fetch Room Types
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*')
    .eq('hotel_id', params.hotelId);

  // 3. Fetch Menu Items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('hotel_id', params.hotelId)
    .eq('is_available', true);

  // 4. Fetch Menu Categories
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('name')
    .eq('hotel_id', params.hotelId)
    .order('name');

  if (!hotel) return <div>Hotel not found</div>;

  return (
    <HotelStorefront
      hotel={hotel}
      roomTypes={roomTypes || []}
      menuItems={menuItems || []}
      categories={categories?.map(c => c.name) || []}
    />
  );
}
