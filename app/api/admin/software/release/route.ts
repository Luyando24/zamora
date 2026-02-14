import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const body = await req.json();
    const { version, download_url, release_notes, platform, is_latest } = body;

    if (!version || !download_url || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If this is the latest release, mark all other releases for this platform as not latest
    if (is_latest) {
      await supabase
        .from('app_releases')
        .update({ is_latest: false })
        .eq('platform', platform);
    }

    // Create the new release record
    const { data, error } = await supabase
      .from('app_releases')
      .insert([
        {
          version,
          download_url,
          release_notes,
          platform,
          is_latest: is_latest ?? true
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);

  } catch (err: any) {
    console.error('Create release error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (optional, but good for admin routes)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('app_releases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Fetch releases error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing release ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('app_releases')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete release error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
