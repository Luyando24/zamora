import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from('service_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Request updated to ${status}` });

  } catch (error: any) {
    console.error('Update Service Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
