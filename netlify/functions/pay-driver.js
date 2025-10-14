const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { orderId, driverId, amount, description } = JSON.parse(event.body);
    
    if (!orderId || !driverId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Order ID, driver ID, and amount are required' })
      };
    }

    console.log(`Processing driver payment: $${amount} to driver ${driverId} for order ${orderId}`);

    // Create transfer to driver's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: driverId, // Driver's Stripe Connect account ID
      description: description || `Payment for order ${orderId}`,
      metadata: {
        order_id: orderId,
        payment_type: 'driver_commission'
      }
    });

    console.log(`Transfer created: ${transfer.id}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        transferId: transfer.id,
        amount: amount,
        status: 'success'
      })
    };

  } catch (error) {
    console.error('Error processing driver payment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to process driver payment',
        details: error.message 
      })
    };
  }
};
