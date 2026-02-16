import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const bookingId = params.bookingId;
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
    const { propertyId, ...updates } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
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

    // 2. Update booking
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .eq('property_id', propertyId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Handle Side Effects (Room Status)
    if (updates.status === 'checked_in') {
        await supabase.from('rooms').update({ status: 'occupied' }).eq('id', booking.room_id);
    } else if (updates.status === 'checked_out') {
        await supabase.from('rooms').update({ status: 'dirty' }).eq('id', booking.room_id);
    } else if (updates.status === 'cancelled') {
        await supabase.from('rooms').update({ status: 'available' }).eq('id', booking.room_id);
    }

    return NextResponse.json({ success: true, data: booking });

  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
