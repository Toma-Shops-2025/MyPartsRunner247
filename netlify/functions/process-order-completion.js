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
    const netAfterStripeFee = orderTotal - stripeFee; // What platform actually received after Stripe fee
    
    // Driver gets exactly 70% of order total (gross)
    const driverPaymentGross = orderTotal * 0.70;
    
    // Platform share is 30% of gross, minus Stripe fee
    const platformShareGross = orderTotal * 0.30;
    const platformNetAfterFee = platformShareGross - stripeFee;
    
    // Since Stripe fee was already deducted from the payment, we transfer driver's 70% from the net
    // Platform keeps: net - driver payment = (orderTotal - stripeFee) - (orderTotal * 0.70)
    // Which equals: orderTotal - stripeFee - orderTotal * 0.70 = orderTotal * 0.30 - stripeFee
    const driverPaymentAmount = Math.round(driverPaymentGross * 100); // Amount to transfer in cents

    console.log(`💰 PAYOUT CALCULATION:`);
    console.log(`   Order total (gross): $${orderTotal.toFixed(2)}`);
    console.log(`   Stripe fee: $${stripeFee.toFixed(2)}`);
    console.log(`   Platform received (net): $${netAfterStripeFee.toFixed(2)}`);
    console.log(`   Driver payment (70% of gross): $${driverPaymentGross.toFixed(2)}`);
    console.log(`   Platform keeps (30% - fees): $${platformNetAfterFee.toFixed(2)}`);

    // Check if driver has Stripe Connect account
    const stripeAccountId = driver.stripe_account_id;
    const stripeConnected = driver.stripe_connected;
    
    if (!stripeAccountId || !stripeConnected) {
      console.log('⚠️ Driver has no Stripe account or not connected, skipping payment');
      console.log('   Driver ID:', order.driver_id);
      console.log('   Stripe account ID:', stripeAccountId);
      console.log('   Stripe connected:', stripeConnected);
      console.log('   Driver payment would be:', driverPaymentGross.toFixed(2));
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Driver payment skipped - no Stripe account connected',
          driverPayment: driverPaymentGross.toFixed(2),
          stripeAccountId: stripeAccountId || 'none',
          stripeConnected: stripeConnected || false,
          warning: 'Driver must connect Stripe account to receive payments'
        })
      };
    }

    // Create earnings record
    const { error: earningsError } = await supabase
      .from('earnings')
      .insert({
        driver_id: order.driver_id,
        order_id: orderId,
        amount: driverPaymentGross,
        status: 'pending'
      });

    if (earningsError) {
      console.error('Error creating earnings record:', earningsError);
    }

    // Process payment to driver
    try {
      console.log(`💸 Creating transfer: $${(driverPaymentAmount / 100).toFixed(2)} to driver ${stripeAccountId}`);
      
      const transfer = await stripe.transfers.create({
        amount: driverPaymentAmount, // Already in cents
        currency: 'usd',
        destination: stripeAccountId,
        description: `Driver payment (70%) for order ${orderId}`,
        metadata: {
          order_id: orderId,
          payment_type: 'driver_commission',
          commission_rate: '70%',
          order_total: orderTotal.toFixed(2),
          platform_share: platformNetAfterFee.toFixed(2)
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
          orderTotal: orderTotal.toFixed(2),
          stripeFee: stripeFee.toFixed(2),
          driverPayment: driverPaymentGross.toFixed(2),
          platformShare: platformShareGross.toFixed(2),
          platformNet: platformNetAfterFee.toFixed(2),
          message: 'Driver payment processed successfully - 70% to driver, 30% to platform (fees deducted)'
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
