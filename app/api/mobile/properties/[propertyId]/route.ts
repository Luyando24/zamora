import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .select('name, logo_url, type, whatsapp_booking_phone, address')
      .eq('id', propertyId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('Fetch Property Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
