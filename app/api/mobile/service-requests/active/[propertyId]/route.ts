import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // Optional filter: e.g., 'bill', 'call_waiter'
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    let query = admin
      .from('service_requests')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'pending') // Only active requests
      .order('created_at', { ascending: true });

    if (type) {
        const types = type.split(',').map(t => t.trim());
        query = query.in('type', types);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ requests: data });

  } catch (error: any) {
    console.error('Get Active Service Requests Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
