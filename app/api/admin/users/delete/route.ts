import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Verify requester is super_admin
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (requesterProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const adminClient = getSupabaseAdmin();

    // Delete user from Auth (this will cascade to profiles due to DB constraints)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
