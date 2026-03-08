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
      firstName, 
      lastName, 
      email, 
      phone 
    } = body;

    if (!propertyId || !firstName || !lastName) {
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

    // 2. Create Guest
    const { data: guest, error: createError } = await supabase
      .from('guests')
      .insert({
        property_id: propertyId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone
      })
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json({ success: true, data: guest });

  } catch (error: any) {
    console.error('Error creating guest:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
