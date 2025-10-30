const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { orderId } = JSON.parse(event.body);
    
    if (!orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Order ID is required' })
      };
    }

    console.log(`Processing order completion for order: ${orderId}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get driver details
    const { data: driver, error: driverError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.driver_id)
      .single();

    if (driverError || !driver) {
      throw new Error('Driver not found');
    }

    // Calculate payment split: Driver gets 70% of order total, Platform gets 30% (Stripe fee deducted from platform)
    const orderTotal = parseFloat(order.total) || 0;
    const stripeFee = (orderTotal * 0.029) + 0.30; // 2.9% + 30¢ Stripe processing fee
    
    // Driver gets exactly 70% of order total
    const driverPayment = orderTotal * 0.70;
    
    // Platform gets 30% of order total, minus Stripe fee
    const platformShare = orderTotal * 0.30;
    const platformNet = platformShare - stripeFee;

    console.log(`Order total: $${orderTotal.toFixed(2)}`);
    console.log(`Driver payment (70%): $${driverPayment.toFixed(2)}`);
    console.log(`Platform share (30%): $${platformShare.toFixed(2)}, Stripe fee: $${stripeFee.toFixed(2)}, Platform net: $${platformNet.toFixed(2)}`);

    // Check if driver has Stripe Connect account
    const stripeAccountId = driver.stripe_account_id;
    const stripeConnected = driver.stripe_connected;
    
    if (!stripeAccountId || !stripeConnected) {
      console.log('Driver has no Stripe account or not connected, skipping payment');
      console.log('Stripe account ID:', stripeAccountId);
      console.log('Stripe connected:', stripeConnected);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Driver payment skipped - no Stripe account connected',
          driverPayment: driverPayment,
          stripeAccountId: stripeAccountId,
          stripeConnected: stripeConnected
        })
      };
    }

    // Create earnings record
    const { error: earningsError } = await supabase
      .from('earnings')
      .insert({
        driver_id: order.driver_id,
        order_id: orderId,
        amount: driverPayment,
        status: 'pending'
      });

    if (earningsError) {
      console.error('Error creating earnings record:', earningsError);
    }

    // Process payment to driver
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(driverPayment * 100), // Convert to cents
        currency: 'usd',
        destination: stripeAccountId,
        description: `Payment for order ${orderId}`,
        metadata: {
          order_id: orderId,
          payment_type: 'driver_commission',
          commission_rate: '70%'
        }
      });

      console.log(`Transfer created: ${transfer.id}`);

      // Update earnings record with transfer ID
      await supabase
        .from('earnings')
        .update({
          status: 'paid',
          transfer_id: transfer.id,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          transferId: transfer.id,
          orderTotal: orderTotal,
          stripeFee: stripeFee,
          driverPayment: driverPayment,
          platformShare: platformShare,
          platformNet: platformNet,
          message: 'Driver payment processed successfully'
        })
      };

    } catch (stripeError) {
      console.error('Stripe transfer error:', stripeError);
      
      // Update earnings record as failed
      await supabase
        .from('earnings')
        .update({
          status: 'failed',
          error_message: stripeError.message
        })
        .eq('order_id', orderId);

      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Failed to process driver payment',
          details: stripeError.message
        })
      };
    }

  } catch (error) {
    console.error('Error processing order completion:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to process order completion',
        details: error.message 
      })
    };
  }
};
