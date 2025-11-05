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
      console.error('❌ Missing subscription or userId');
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing subscription or userId' }) 
      };
    }

    console.log(`💾 SAVE-PUSH-SUBSCRIPTION: Saving subscription for user ${userId}`);
    console.log(`   Endpoint: ${subscription.endpoint?.substring(0, 50)}...`);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if subscription already exists for this endpoint
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      console.log(`   Updating existing subscription for user ${userId} (endpoint already exists)`);
    } else {
      console.log(`   Creating new subscription for user ${userId}`);
    }

    // Delete any existing subscriptions for this user (one subscription per user)
    // This ensures we don't have multiple subscriptions per user
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    // Save subscription to database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error saving subscription:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to save subscription',
          details: error.message 
        })
      };
    }

    console.log(`✅ Subscription saved successfully for user ${userId}`);
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
