// Save Driver Payment Method - Multiple Payment Options
// ====================================================

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { method, data } = JSON.parse(event.body);

    if (!method || !data) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Method and data are required' }) 
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user ID from headers or request
    const userId = data.user_id || 'temp-user-id'; // You'll need to pass this from frontend

    // Encrypt sensitive data (in production, use proper encryption)
    const encryptedData = {
      method: method,
      data: data,
      created_at: new Date().toISOString(),
      is_active: true
    };

    // Save payment method to database
    const { data: result, error } = await supabase
      .from('driver_payment_methods')
      .upsert({
        user_id: userId,
        payment_method: method,
        payment_data: encryptedData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving payment method:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save payment method' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Payment method saved successfully',
        method: method
      })
    };

  } catch (error) {
    console.error('Error in save-driver-payment-method:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
