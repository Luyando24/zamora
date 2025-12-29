import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { propertyId } = params;

    if (!propertyId) {
        return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Fetch Room Types
    const { data: roomTypes, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', propertyId)
      .order('base_price', { ascending: true });

    if (error) {
      console.error('[Mobile Rooms] Fetch failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform if necessary (e.g. handle null images)
    const formattedRooms = roomTypes?.map(room => ({
        ...room,
        price: room.base_price, // Ensure price is exposed as 'price' if app expects it
        image: room.image_url || room.gallery_urls?.[0] || null // Ensure 'image' field exists
    }));

    return NextResponse.json({
      rooms: formattedRooms || []
    });

  } catch (error: any) {
    console.error('[Mobile Rooms] Internal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
