
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: authHeader } }
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, name, basePrice, description, capacity, bedType, category } = body;

    if (!propertyId || !name || basePrice === undefined || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access to this property
    const { data: profile } = await supabase
      .from('profiles')
      .select('property_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.property_id !== propertyId && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: roomType, error: createError } = await supabase
      .from('room_types')
      .insert({
        property_id: propertyId,
        name,
        base_price: basePrice,
        description,
        capacity,
        bed_type: bedType,
        category: category || 'room'
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ success: true, data: roomType });
  } catch (error: any) {
    console.error('Error creating room type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
