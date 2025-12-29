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

    // Fetch property details for WhatsApp number
    const { data: propertyData } = await supabase
      .from('properties')
      .select('whatsapp_booking_phone')
      .eq('id', propertyId)
      .single();
    
    const whatsappPhone = propertyData?.whatsapp_booking_phone || null;

    // Fetch Room Types
    // Note: The schema might use 'property_id' or 'hotel_id'. 
    // Based on test script, 'property_id' works for Ringroad View Lodge.
    // We will try property_id first.
    let { data: roomTypes, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('property_id', propertyId)
      .order('base_price', { ascending: true });

    // Fallback for older schema if property_id column doesn't exist (PGRST errors usually differ)
    // But since the script succeeded with property_id, we assume property_id is correct.
    // However, if it returns an error about column not found, we could try hotel_id?
    // Given the script output "No room types found" for one property and valid types for another, 
    // it implies property_id is likely the correct column if it didn't error out.
    
    if (error && error.message.includes('column room_types.property_id does not exist')) {
       console.log('[Mobile Rooms] property_id not found, trying hotel_id');
       const { data: retryData, error: retryError } = await supabase
         .from('room_types')
         .select('*')
         .eq('hotel_id', propertyId)
         .order('base_price', { ascending: true });
         
       roomTypes = retryData;
       error = retryError;
    }

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
