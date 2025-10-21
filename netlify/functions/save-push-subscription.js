// FREE Netlify Function to save push subscriptions
// ===============================================

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { subscription, userId } = JSON.parse(event.body);

    if (!subscription || !userId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing subscription or userId' }) 
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Save subscription to database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving subscription:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save subscription' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Subscription saved successfully',
        data: data 
      })
    };

  } catch (error) {
    console.error('Error in save-push-subscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
