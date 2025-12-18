import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's property_id from metadata or profile
    let propertyId = user.user_metadata?.property_id;
    if (!propertyId) {
        const { data: profile } = await supabase.from('profiles').select('property_id').eq('id', user.id).single();
        propertyId = profile?.property_id;
    }

    if (!propertyId) {
        return NextResponse.json({ error: 'No property associated' }, { status: 400 });
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', subscription.endpoint)
        .single();

    if (existing) {
        // Update if needed (e.g., timestamps), or just return success
        return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    // Save to DB
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: user.id,
      property_id: propertyId,
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
