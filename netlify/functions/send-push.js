const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  'mailto:notifications@mypartsrunner.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userIds, title, body, data } = JSON.parse(event.body || '{}');
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return { statusCode: 400, body: 'userIds required' };
    }

    // Fetch subscriptions for these users
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (error) {
      console.error('Supabase error:', error);
      return { statusCode: 500, body: 'Failed to fetch subscriptions' };
    }

    let sent = 0, failed = 0;
    const payload = JSON.stringify({ title: title || 'MyPartsRunner', body: body || '', data: data || {} });

    // Send to each subscription
    for (const sub of subs || []) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (e) {
        console.error('Push failed for', sub.user_id, e && e.statusCode);
        failed++;
        // If gone, delete subscription
        if (e && (e.statusCode === 404 || e.statusCode === 410)) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ sent, failed }) };
  } catch (e) {
    console.error('send-push error:', e);
    return { statusCode: 500, body: 'Unexpected error' };
  }
};


