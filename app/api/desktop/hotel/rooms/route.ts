import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      propertyId, 
      roomNumber, 
      roomTypeId,
      status = 'clean'
    } = body;

    if (!propertyId || !roomNumber || !roomTypeId) {
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

    // 2. Check if room number already exists for this property
    const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('property_id', propertyId)
        .eq('room_number', roomNumber)
        .single();

    if (existingRoom) {
        return NextResponse.json({ error: 'Room number already exists' }, { status: 409 });
    }

    // 3. Create Room
    const { data: room, error: createError } = await supabase
      .from('rooms')
      .insert({
        property_id: propertyId,
        room_number: roomNumber,
        room_type_id: roomTypeId,
        status
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ success: true, data: room });

  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
