import { NextResponse } from 'next/server';
import { notifyAdmin } from '@/lib/sms';

import { getSupabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(request: Request) {
  try {
    const { message, propertyId } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let targetPhone = null;

    if (propertyId) {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: property } = await supabaseAdmin
            .from('properties')
            .select('admin_notification_phone')
            .eq('id', propertyId)
            .single();
        
        targetPhone = property?.admin_notification_phone;
    }

    const result = await notifyAdmin(message, targetPhone);
    
    if (!result.success) {
         // Don't fail the request if SMS fails, just log it and return warning
         // unless it's critical. For notifications, it's usually better to not break the flow.
         // But here we want to know if it worked.
         console.error('SMS Notification failed:', result.error);
         return NextResponse.json({ error: 'Failed to send SMS', details: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in SMS notification route:', error);
    return NextResponse.json({ error: 'Internal Error: ' + error.message }, { status: 500 });
  }
}
