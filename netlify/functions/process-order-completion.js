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

    // Create earnings record (non-blocking - continue even if this fails)
    try {
      const { error: earningsError } = await supabase
        .from('earnings')
        .insert({
          driver_id: order.driver_id,
          order_id: orderId,
          amount: driverPaymentGross,
          status: 'pending'
        });

      if (earningsError) {
        console.warn('⚠️ Earnings record creation failed (non-critical):', earningsError.message);
        // Continue processing even if earnings record fails
      } else {
        console.log('✅ Earnings record created');
      }
    } catch (earningsErr) {
      console.warn('⚠️ Earnings record creation error (non-critical):', earningsErr.message);
      // Continue processing even if earnings record fails
    }

    // Process payment to driver
    try {
      console.log(`💸 CREATING TRANSFER TO DRIVER`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Driver ID: ${order.driver_id}`);
      console.log(`   Driver Stripe Account: ${stripeAccountId}`);
      console.log(`   Amount: $${(driverPaymentAmount / 100).toFixed(2)}`);
      console.log(`   Order Total: $${orderTotal.toFixed(2)}`);
      
      // IMPORTANT: Stripe Connect transfers go to driver's Stripe balance
      // From there, funds pay out on driver's schedule (2-7 days by default)
      // For instant payouts, driver must:
      // 1. Have instant payouts enabled in their Stripe account
      // 2. Have a debit card added
      // 3. Manually trigger instant payout OR have it auto-enabled
      
      // Verify we have enough balance to transfer
      try {
        const balance = await stripe.balance.retrieve();
        const availableBalance = balance.available[0]?.amount || 0;
        console.log(`   Platform available balance: $${(availableBalance / 100).toFixed(2)}`);
        
        if (availableBalance < driverPaymentAmount) {
          console.error(`❌ INSUFFICIENT BALANCE! Need $${(driverPaymentAmount / 100).toFixed(2)}, have $${(availableBalance / 100).toFixed(2)}`);
          throw new Error(`Insufficient balance. Need $${(driverPaymentAmount / 100).toFixed(2)}, have $${(availableBalance / 100).toFixed(2)}`);
        }
      } catch (balanceError) {
        console.warn('⚠️ Could not check balance, continuing anyway:', balanceError.message);
      }
      
      // Verify driver account before transferring
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        console.log(`   Account status: ${account.details_submitted ? 'onboarded' : 'not onboarded'}`);
        console.log(`   Charges enabled: ${account.charges_enabled}`);
        console.log(`   Payouts enabled: ${account.payouts_enabled}`);
        console.log(`   Transfers capability: ${account.capabilities?.transfers || 'not_requested'}`);
        
        if (account.capabilities?.transfers !== 'active') {
          console.error(`❌ TRANSFERS CAPABILITY NOT ACTIVE! Status: ${account.capabilities?.transfers}`);
          throw new Error(`Driver transfers capability is ${account.capabilities?.transfers || 'not_requested'}. Must be 'active' to receive transfers.`);
        }
      } catch (accountCheckError) {
        console.error('❌ Error checking driver account:', accountCheckError);
        throw accountCheckError;
      }
      
      // Create transfer to driver's Stripe Connect account
      // This puts money in their Stripe balance immediately
      // Payout timing depends on driver's account settings
      console.log(`   Creating transfer now...`);
      const transfer = await stripe.transfers.create({
        amount: driverPaymentAmount,
        currency: 'usd',
        destination: stripeAccountId,
        description: `Driver payment (70%) for order ${orderId}`,
        metadata: {
          order_id: orderId,
          driver_id: order.driver_id,
          payment_type: 'driver_commission',
          commission_rate: '70%',
          order_total: orderTotal.toFixed(2),
          platform_share: platformNetAfterFee.toFixed(2),
          note: 'Funds transferred to driver Stripe balance. Payout timing depends on driver account settings.'
        }
      });
      
      console.log(`✅ TRANSFER CREATED SUCCESSFULLY!`);
      console.log(`   Transfer ID: ${transfer.id}`);
      console.log(`   Transfer Amount: $${(transfer.amount / 100).toFixed(2)}`);
      console.log(`   Transfer Status: ${transfer.status}`);
      console.log(`   Destination: ${transfer.destination}`);
      
      // Check if driver has instant payout capability
      let payoutTiming = '2-7 business days (standard Stripe schedule)';
      let instantAvailable = false;
      
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        // Check account settings for instant payout availability
        // Note: Even if available, driver must have debit card to use it
        instantAvailable = account.details_submitted && 
                          account.payouts_enabled && 
                          account.capabilities?.transfers === 'active';
        
        if (instantAvailable) {
          payoutTiming = 'Funds are in your Stripe account. Add a debit card for instant payouts (minutes), otherwise 2-7 business days.';
        }
      } catch (accountCheckError) {
        console.log('Could not check account for instant payout availability');
      }

      console.log(`✅ Transfer created: ${transfer.id}`);
      console.log(`   Amount: $${(driverPaymentAmount / 100).toFixed(2)}`);
      console.log(`   Driver: ${stripeAccountId}`);
      console.log(`   Instant payouts available: ${instantAvailable ? 'Yes (if debit card added)' : 'No'}`);

      // Update earnings record with transfer ID
      await supabase
        .from('earnings')
        .update({
          status: 'paid',
          transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
          payout_method: instantAvailable ? 'instant_available' : 'standard'
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
          instantPayoutsAvailable: instantAvailable,
          payoutTiming: payoutTiming,
          message: `✅ Driver payment processed successfully! 70% ($${driverPaymentGross.toFixed(2)}) transferred to driver Stripe account. ${payoutTiming}`,
          note: instantAvailable 
            ? 'Driver can add debit card in Stripe dashboard to enable instant payouts (minutes vs 2-7 days)'
            : 'Driver will receive payout in 2-7 business days per Stripe standard schedule'
        })
      };

    } catch (stripeError) {
      console.error('❌❌❌ STRIPE TRANSFER ERROR ❌❌❌');
      console.error('   Error Type:', stripeError.type);
      console.error('   Error Code:', stripeError.code);
      console.error('   Error Message:', stripeError.message);
      console.error('   Error Status:', stripeError.statusCode);
      console.error('   Full Error:', JSON.stringify(stripeError, null, 2));
      
      // Check for specific capability error
      let errorMessage = stripeError.message;
      let userFriendlyMessage = errorMessage;
      
      if (stripeError.code === 'insufficient_capabilities_for_transfer') {
        userFriendlyMessage = 'Driver Stripe account is not fully set up. The driver needs to complete Stripe Connect onboarding and enable transfers capability.';
        console.error('🚫 Driver Stripe account missing transfers capability. Driver must complete onboarding at: https://dashboard.stripe.com');
      } else if (stripeError.code === 'insufficient_funds') {
        userFriendlyMessage = 'Platform account does not have sufficient funds to transfer to driver. Check Stripe balance.';
        console.error('🚫 INSUFFICIENT FUNDS in platform account to transfer to driver!');
      } else if (stripeError.code === 'account_invalid') {
        userFriendlyMessage = 'Driver Stripe account is invalid or does not exist. Driver must reconnect their Stripe account.';
        console.error('🚫 Driver Stripe account is invalid!');
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        userFriendlyMessage = `Stripe rejected the transfer request: ${stripeError.message}`;
        console.error('🚫 Stripe rejected transfer request!');
      }
      
      // Try to update earnings record as failed (non-blocking)
      try {
        await supabase
          .from('earnings')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('order_id', orderId);
      } catch (updateErr) {
        console.warn('⚠️ Could not update earnings record:', updateErr.message);
      }

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Failed to process driver payment',
          details: userFriendlyMessage,
          stripeError: stripeError.code,
          technicalDetails: errorMessage,
          driverAction: stripeError.code === 'insufficient_capabilities_for_transfer' 
            ? 'Driver must complete Stripe Connect onboarding in their Stripe dashboard'
            : 'Please contact support'
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
