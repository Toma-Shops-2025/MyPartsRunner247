// Netlify function to handle driver location updates
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { updates } = JSON.parse(event.body);
    
    if (!updates || !Array.isArray(updates)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid updates data' })
      };
    }

    console.log(`Received ${updates.length} location updates`);

    // Process each location update
    for (const update of updates) {
      console.log(`Processing location update for driver ${update.driverId}, order ${update.orderId}:`, {
        lat: update.lat,
        lng: update.lng,
        timestamp: new Date(update.timestamp).toISOString()
      });

      // Here you would typically:
      // 1. Store in database (Supabase)
      // 2. Send to WebSocket clients
      // 3. Update order status
      // 4. Send notifications to customers

      // For now, we'll just log the updates
      // In a real implementation, you'd integrate with your database
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: `Processed ${updates.length} location updates`,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error processing location updates:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to process location updates',
        details: error.message 
      })
    };
  }
};
