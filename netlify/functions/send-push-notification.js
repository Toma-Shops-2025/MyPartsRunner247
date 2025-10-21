// FREE Netlify Function to send push notifications
// ===============================================

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Configure VAPID keys (generate these for free)
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Your email
  process.env.VAPID_PUBLIC_KEY,    // Your VAPID public key
  process.env.VAPID_PRIVATE_KEY    // Your VAPID private key
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, title, body, data, icon, badge } = JSON.parse(event.body);

    if (!userId || !title || !body) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing required fields' }) 
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user's push subscription
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No push subscription found' })
      };
    }

    // Prepare push payload
    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/xmark.png'
        }
      ]
    });

    // Send push notification
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      }, payload);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Push notification sent successfully' 
        })
      };

    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      
      // If subscription is invalid, remove it
      if (pushError.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId);
      }

      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send notification' })
      };
    }

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
