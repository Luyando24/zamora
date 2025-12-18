import { NextResponse } from 'next/server';
import { sendPushNotificationToProperty } from '@/lib/push-notifications';

export async function POST(request: Request) {
  try {
    const { propertyId, title, message, url } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const result = await sendPushNotificationToProperty(propertyId, title, message, url);
    
    if (!result.success) {
         return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
