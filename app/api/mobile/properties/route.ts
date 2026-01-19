import { getSupabaseAdmin } from '@/lib/db/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch all public properties with currency
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id, name, address, city, country, phone, email, 
        website_url, facebook_url, instagram_url, twitter_url, 
        logo_url, cover_image_url, gallery_urls, description, 
        amenities, created_at, slug, whatsapp_booking_phone, type,
        currency_symbol
      `)
      .order('name');

    if (error) {
      console.error('Properties Fetch Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch all room types (lightweight select)
    const { data: roomTypes, error: roomError } = await supabase
      .from('room_types')
      .select('property_id, base_price');

    if (roomError) {
      console.error('Room Types Fetch Error:', roomError);
      // Continue without prices if room fetch fails, or fail? 
      // Better to return properties with 0 price than fail completely.
    }

    // 3. Calculate min_price per property
    const minPrices: Record<string, number> = {};
    
    if (roomTypes) {
      roomTypes.forEach((room: any) => {
        const pid = room.property_id;
        const price = Number(room.base_price);
        
        if (!minPrices[pid] || price < minPrices[pid]) {
          minPrices[pid] = price;
        }
      });
    }

    // 4. Transform data for mobile app
    const formattedProperties = properties.map(p => ({
      ...p,
      min_price: minPrices[p.id] || 0,
      display_image: p.cover_image_url || p.logo_url || p.gallery_urls?.[0] || null
    }));

    return NextResponse.json({ properties: formattedProperties });
  } catch (error: any) {
    console.error('Internal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
