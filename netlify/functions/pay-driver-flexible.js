// Flexible Driver Payment - Multiple Payment Methods
// ==================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { orderId, driverId, amount, description } = JSON.parse(event.body);
    
    if (!orderId || !driverId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Order ID, driver ID, and amount are required' })
      };
    }

    console.log(`Processing flexible driver payment: $${amount} to driver ${driverId} for order ${orderId}`);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get driver's payment method
    const { data: paymentMethod, error: methodError } = await supabase
      .from('driver_payment_methods')
      .select('*')
      .eq('user_id', driverId)
      .single();

    if (methodError || !paymentMethod) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No payment method found for driver' })
      };
    }

    const method = paymentMethod.payment_method;
    const paymentData = paymentMethod.payment_data.data;

    let paymentResult;

    switch (method) {
      case 'bank':
        // Traditional bank transfer via Stripe Connect
        paymentResult = await processBankTransfer(driverId, amount, orderId, description);
        break;

      case 'debit':
        // Debit card payment via Stripe
        paymentResult = await processDebitCardPayment(paymentData, amount, orderId, description);
        break;

      case 'cashapp':
        // Cash App payment (via Cash App API or manual process)
        paymentResult = await processCashAppPayment(paymentData, amount, orderId, description);
        break;

      case 'paypal':
        // PayPal payment via PayPal API
        paymentResult = await processPayPalPayment(paymentData, amount, orderId, description);
        break;

      default:
        throw new Error('Unsupported payment method');
    }

    // Log payment in database
    await supabase
      .from('driver_payments')
      .insert({
        driver_id: driverId,
        order_id: orderId,
        amount: amount,
        payment_method: method,
        payment_id: paymentResult.paymentId,
        status: paymentResult.status,
        created_at: new Date().toISOString()
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        paymentId: paymentResult.paymentId,
        method: method,
        amount: amount,
        status: paymentResult.status
      })
    };

  } catch (error) {
    console.error('Error processing flexible driver payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process driver payment',
        details: error.message 
      })
    };
  }
};

// Bank transfer via Stripe Connect
async function processBankTransfer(driverId, amount, orderId, description) {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination: driverId,
    description: description || `Payment for order ${orderId}`,
    metadata: {
      order_id: orderId,
      payment_type: 'driver_commission'
    }
  });

  return {
    paymentId: transfer.id,
    status: 'completed'
  };
}

// Debit card payment via Stripe
async function processDebitCardPayment(paymentData, amount, orderId, description) {
  // Create payment intent for debit card
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    payment_method: paymentData.stripe_payment_method_id, // Pre-saved payment method
    confirmation_method: 'automatic',
    confirm: true,
    description: description || `Driver payment for order ${orderId}`,
    metadata: {
      order_id: orderId,
      payment_type: 'driver_commission'
    }
  });

  return {
    paymentId: paymentIntent.id,
    status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending'
  };
}

// Cash App payment (simplified - in production, use Cash App API)
async function processCashAppPayment(paymentData, amount, orderId, description) {
  // For now, we'll simulate Cash App payment
  // In production, integrate with Cash App API
  console.log(`Cash App payment: $${amount} to ${paymentData.cashapp_username}`);
  
  // Simulate API call to Cash App
  // const cashAppResponse = await cashAppAPI.sendPayment({
  //   username: paymentData.cashapp_username,
  //   amount: amount,
  //   note: description
  // });

  return {
    paymentId: `cashapp_${Date.now()}`,
    status: 'completed' // In production, check actual API response
  };
}

// PayPal payment via PayPal API
async function processPayPalPayment(paymentData, amount, orderId, description) {
  // For now, we'll simulate PayPal payment
  // In production, integrate with PayPal API
  console.log(`PayPal payment: $${amount} to ${paymentData.paypal_email}`);
  
  // Simulate API call to PayPal
  // const paypalResponse = await paypalAPI.sendPayment({
  //   email: paymentData.paypal_email,
  //   amount: amount,
  //   description: description
  // });

  return {
    paymentId: `paypal_${Date.now()}`,
    status: 'completed' // In production, check actual API response
  };
}
