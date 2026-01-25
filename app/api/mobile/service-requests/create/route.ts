import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, tableNumber, roomNumber, type = 'call_waiter', notes } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    if (!tableNumber && !roomNumber) {
      return NextResponse.json({ error: 'Table or Room number is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('service_requests')
      .insert({
        property_id: propertyId,
        table_number: tableNumber,
        room_number: roomNumber,
        type,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Optional: Trigger Push Notification to Waiter App
    // In a real scenario, you'd send this to a dedicated notification service or channel
    // For now, the database insert triggers the realtime subscription in the Waiter App

    return NextResponse.json({ success: true, request: data });

  } catch (error: any) {
    console.error('Create Service Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
