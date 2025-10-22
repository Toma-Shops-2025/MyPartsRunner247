// ANALYTICS ENDPOINT - FREE Business Intelligence Tracking
// =======================================================

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sessionId, userId, timestamp, events } = JSON.parse(event.body);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Process each analytics event
    for (const eventData of events) {
      // Log analytics event to console
      console.log('📊 ANALYTICS EVENT:', {
        sessionId,
        userId,
        timestamp,
        event: eventData.event,
        properties: eventData.properties
      });

      // Store in Supabase (if you want to persist analytics)
      try {
        const { error: dbError } = await supabase
          .from('analytics_events')
          .insert([{
            session_id: sessionId,
            user_id: userId,
            event_name: eventData.event,
            event_properties: eventData.properties,
            event_url: eventData.url,
            user_agent: eventData.userAgent,
            created_at: new Date().toISOString()
          }]);

        if (dbError) {
          console.error('Database error:', dbError);
        }
      } catch (dbError) {
        console.error('Failed to store analytics event in database:', dbError);
      }
    }

    // Track business metrics
    const businessEvents = events.filter(event => 
      ['order_placed', 'order_completed', 'driver_signup', 'customer_signup', 'payment_processed'].includes(event.event)
    );

    if (businessEvents.length > 0) {
      console.log('📈 BUSINESS METRICS:', businessEvents);
      
      // Here you could send alerts to Slack, email, etc.
      // For now, we'll just log them prominently
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Processed ${events.length} analytics events`,
        businessEvents: businessEvents.length
      })
    };

  } catch (error) {
    console.error('Error processing analytics events:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process analytics events'
      })
    };
  }
};
