import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyAdmin } from '@/lib/sms';
import { sendPushNotificationToProperty } from '@/lib/push-notifications';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
          global: {
              headers: {
                  Authorization: authHeader,
              },
          },
      }
  );
  
  try {
    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      roomTypeId, 
      propertyId, 
      checkIn, 
      checkOut, 
      guestDetails 
    } = body;

    if (!roomTypeId || !propertyId || !checkIn || !checkOut || !guestDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify property access
    const { data: profile } = await supabase
      .from('profiles')
      .select('property_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.property_id !== propertyId && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify Property Type
    const { data: property } = await supabase
      .from('properties')
      .select('type')
      .eq('id', propertyId)
      .single();

    const ALLOWED_TYPES = ['hotel', 'lodge'];
    if (!property || !ALLOWED_TYPES.includes(property.type)) {
       return NextResponse.json({ 
           error: 'This feature is only available for hotels and lodges',
           code: 'INVALID_PROPERTY_TYPE'
       }, { status: 400 });
    }

    // 2. Find available room
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_type_id', roomTypeId)
      .eq('property_id', propertyId);

    if (roomsError) throw roomsError;
    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'No rooms of this type found' }, { status: 404 });
    }

    const roomIds = rooms.map(r => r.id);

    // Find overlapping bookings
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_id')
      .in('room_id', roomIds)
      .neq('status', 'cancelled')
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if (bookingsError) throw bookingsError;

    const bookedRoomIds = new Set(conflictingBookings?.map(b => b.room_id) || []);
    const availableRoom = rooms.find(r => !bookedRoomIds.has(r.id));

    if (!availableRoom) {
      return NextResponse.json({ error: 'No rooms available for these dates' }, { status: 409 });
    }

    // 3. Create or Update Guest
    let guestId: string;
    let guestData: any;
    
    // Check if guest exists by email or phone
    let query = supabase.from('guests').select('*').eq('property_id', propertyId);
    if (guestDetails.email) query = query.eq('email', guestDetails.email);
    else if (guestDetails.phone) query = query.eq('phone', guestDetails.phone);
    else return NextResponse.json({ error: 'Guest email or phone required' }, { status: 400 });

    const { data: existingGuest } = await query.single();

    if (existingGuest) {
      guestId = existingGuest.id;
      guestData = existingGuest;
      // Optionally update details
    } else {
      const { data: newGuest, error: createGuestError } = await supabase
        .from('guests')
        .insert({
          property_id: propertyId,
          first_name: guestDetails.firstName,
          last_name: guestDetails.lastName,
          email: guestDetails.email,
          phone: guestDetails.phone,
          // Add other fields if needed
        })
        .select()
        .single();
      
      if (createGuestError) throw createGuestError;
      guestId = newGuest.id;
      guestData = newGuest;
    }

    // 4. Create Booking
    const bookingPayload = {
      property_id: propertyId,
      guest_id: guestId,
      room_id: availableRoom.id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      status: 'confirmed',
      created_by: user.id
    };
    console.log('[API] Inserting Booking:', JSON.stringify(bookingPayload, null, 2));

    const { data: booking, error: createBookingError } = await supabase
      .from('bookings')
      .insert(bookingPayload)
      .select()
      .single();

    if (createBookingError) throw createBookingError;

    // 5. Create Folio automatically
    const { error: folioError } = await supabase
      .from('folios')
      .insert({
        booking_id: booking.id,
        property_id: propertyId,
        status: 'open',
        total_amount: 0
      });

    if (folioError) console.error('Failed to create folio automatically:', folioError);

    return NextResponse.json({ success: true, data: booking, guest: guestData });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
