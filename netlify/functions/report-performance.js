// PERFORMANCE REPORTING ENDPOINT - FREE Performance Monitoring
// ==========================================================

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
    const { sessionId, userId, timestamp, data } = JSON.parse(event.body);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Process each performance metric
    for (const metric of data) {
      // Log performance metric to console
      console.log('📊 PERFORMANCE METRIC:', {
        sessionId,
        userId,
        timestamp,
        metric: {
          name: metric.name,
          value: metric.value,
          category: metric.category,
          url: metric.url
        }
      });

      // Store in Supabase (if you want to persist metrics)
      try {
        const { error: dbError } = await supabase
          .from('performance_metrics')
          .insert([{
            session_id: sessionId,
            user_id: userId,
            metric_name: metric.name,
            metric_value: metric.value,
            metric_category: metric.category,
            metric_url: metric.url,
            created_at: new Date().toISOString()
          }]);

        if (dbError) {
          console.error('Database error:', dbError);
        }
      } catch (dbError) {
        console.error('Failed to store performance metric in database:', dbError);
      }
    }

    // Check for performance issues
    const slowMetrics = data.filter(metric => {
      if (metric.name === 'page_load_time' && metric.value > 3000) return true;
      if (metric.name === 'dom_content_loaded' && metric.value > 1500) return true;
      if (metric.name === 'first_byte' && metric.value > 600) return true;
      return false;
    });

    if (slowMetrics.length > 0) {
      console.warn('⚠️ SLOW PERFORMANCE DETECTED:', slowMetrics);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Processed ${data.length} performance metrics`,
        slowMetrics: slowMetrics.length
      })
    };

  } catch (error) {
    console.error('Error processing performance metrics:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process performance metrics'
      })
    };
  }
};
