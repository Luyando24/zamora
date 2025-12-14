import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyAdmin } from '@/lib/sms';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
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

    // 1. Find available room of this type
    // We need a room that is:
    // a) Of the correct room_type_id
    // b) NOT booked during the requested dates
    //    Overlap logic: (RequestStart < ExistingEnd) AND (RequestEnd > ExistingStart)
    
    // Get all rooms of this type
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_type_id', roomTypeId)
      .eq('hotel_id', propertyId);

    if (roomsError) throw roomsError;
    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'No rooms of this type found' }, { status: 404 });
    }

    const roomIds = rooms.map(r => r.id);

    // Find bookings that overlap
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_id')
      .in('room_id', roomIds)
      .eq('status', 'confirmed') // Only check confirmed bookings? Or checked_in too? 
      // Safer to check all except cancelled
      .neq('status', 'cancelled')
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if (bookingsError) throw bookingsError;

    const bookedRoomIds = new Set(conflictingBookings?.map(b => b.room_id) || []);
    const availableRoom = rooms.find(r => !bookedRoomIds.has(r.id));

    if (!availableRoom) {
      return NextResponse.json({ error: 'No rooms available for these dates' }, { status: 409 });
    }

    // 2. Create or Get Guest
    // We'll search by email for this property
    let guestId: string;
    
    const { data: existingGuest, error: findGuestError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', guestDetails.email)
      .eq('hotel_id', propertyId)
      .single();

    if (existingGuest) {
      guestId = existingGuest.id;
      // Optionally update details? Let's skip for now to avoid overwriting
    } else {
      const { data: newGuest, error: createGuestError } = await supabase
        .from('guests')
        .insert({
          hotel_id: propertyId,
          first_name: guestDetails.firstName,
          last_name: guestDetails.lastName,
          email: guestDetails.email,
          phone: guestDetails.phone
        })
        .select()
        .single();
      
      if (createGuestError) throw createGuestError;
      guestId = newGuest.id;
    }

    // 3. Create Booking
    const { data: booking, error: createBookingError } = await supabase
      .from('bookings')
      .insert({
        hotel_id: propertyId,
        guest_id: guestId,
        room_id: availableRoom.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        status: 'confirmed'
      })
      .select()
      .single();

    if (createBookingError) throw createBookingError;

    // Notify via SMS
    try {
      const { data: property } = await supabase
        .from('properties')
        .select('admin_notification_phone')
        .eq('id', propertyId)
        .single();

      await notifyAdmin(
        `New Web Booking: ${guestDetails.firstName} ${guestDetails.lastName}. Check-in: ${checkIn}`,
        property?.admin_notification_phone
      );
    } catch (e) {
      console.error('SMS Notification Failed:', e);
    }

    return NextResponse.json({ success: true, booking });

  } catch (error: any) {
    console.error('Booking Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
