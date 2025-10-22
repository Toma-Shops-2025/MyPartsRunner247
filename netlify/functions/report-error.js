// ERROR REPORTING ENDPOINT - FREE Error Monitoring
// ================================================

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

    // Process each error report
    for (const error of data) {
      // Log error to console for immediate visibility
      console.error('🚨 ERROR REPORT:', {
        sessionId,
        userId,
        timestamp,
        error: {
          message: error.message,
          stack: error.stack,
          url: error.url,
          severity: error.severity,
          category: error.category
        }
      });

      // Store in Supabase (if you want to persist errors)
      try {
        const { error: dbError } = await supabase
          .from('error_reports')
          .insert([{
            session_id: sessionId,
            user_id: userId,
            error_message: error.message,
            error_stack: error.stack,
            error_url: error.url,
            line_number: error.lineNumber,
            column_number: error.columnNumber,
            severity: error.severity,
            category: error.category,
            user_agent: error.userAgent,
            context: error.context,
            created_at: new Date().toISOString()
          }]);

        if (dbError) {
          console.error('Database error:', dbError);
        }
      } catch (dbError) {
        console.error('Failed to store error in database:', dbError);
      }
    }

    // Send alert for critical errors
    const criticalErrors = data.filter(error => error.severity === 'critical');
    if (criticalErrors.length > 0) {
      console.error('🚨 CRITICAL ERRORS DETECTED:', criticalErrors);
      
      // Here you could send alerts to Slack, email, etc.
      // For now, we'll just log them prominently
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Processed ${data.length} error reports`,
        criticalErrors: criticalErrors.length
      })
    };

  } catch (error) {
    console.error('Error processing error reports:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process error reports'
      })
    };
  }
};
