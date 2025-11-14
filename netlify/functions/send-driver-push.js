import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_URL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
} = process.env;

if (!SUPABASE_SERVICE_ROLE_KEY || !VITE_SUPABASE_URL) {
  console.warn('Missing Supabase environment variables for push function.');
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('Missing VAPID keys for push notifications.');
}

const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

webpush.setVapidDetails('mailto:support@my-runner.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { userId, title, body, data } = JSON.parse(event.body || '{}');
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'userId is required' })
      };
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to load subscriptions:', error);
      return { statusCode: 500, body: JSON.stringify({ message: 'Failed to load subscriptions' }) };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No active subscriptions' }) };
    }

    const payload = JSON.stringify({
      title: title || 'MY-RUNNER.COM',
      body: body || 'You have a new driver update.',
      data: data || {}
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        webpush.sendNotification(subscription, payload).catch(async (err) => {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            console.warn('Removing stale subscription', subscription.endpoint);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
          throw err;
        })
      )
    );

    const failures = results.filter((res) => res.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some notifications failed', failures);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notifications processed', failures: failures.length })
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to send push notification' })
    };
  }
};
