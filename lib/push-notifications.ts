import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const vapidPublicKey = 'BEO6-6HlAhJeC64bwpWmHQEPo77yyOc9imC4h0qbBrUumhbfcI-8WtClPrbEoNVI3Y4-VL5ZULrNlAgmryRnyBo';
const vapidPrivateKey = 's_uAOr5FhN_JEqNjg-UjN5Vwec2hxSt9EQVdF4WvVCA';

webpush.setVapidDetails(
  'mailto:admin@zamora.com',
  vapidPublicKey,
  vapidPrivateKey
);

export async function sendPushNotificationToProperty(propertyId: string, title: string, message: string, url: string = '/') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials for push notifications');
    return { success: false, error: 'Server configuration error' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('property_id', propertyId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
        return { success: true, count: 0, message: 'No subscriptions found' };
    }

    const notifications = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };
      
      const payload = JSON.stringify({
        title,
        body: message,
        url
      });

      return webpush.sendNotification(pushConfig, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log('Deleting expired subscription:', sub.id);
            return supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          console.error('Error sending push:', err);
        });
    });

    await Promise.all(notifications);
    return { success: true, count: subscriptions.length };

  } catch (error: any) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}
