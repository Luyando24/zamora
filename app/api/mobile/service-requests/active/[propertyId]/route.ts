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

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('service_requests')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'pending') // Only active requests
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ requests: data });

  } catch (error: any) {
    console.error('Get Active Service Requests Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
