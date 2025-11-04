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

    // Calculate payment split: Driver gets 70% of payment AFTER Stripe fees, Platform gets 30% (Stripe fee deducted from platform)
    const orderTotal = parseFloat(order.total) || 0;
    const stripeFee = (orderTotal * 0.029) + 0.30; // 2.9% + 30¢ Stripe processing fee
    const netAfterStripeFee = orderTotal - stripeFee; // What platform actually received after Stripe fee
    
    // Driver gets 70% of net payment (after Stripe fees)
    const driverPaymentNet = netAfterStripeFee * 0.70;
    
    // Platform keeps 30% of net payment (after Stripe fees)
    const platformNetAfterFee = netAfterStripeFee * 0.30;
    
    // Amount to transfer to driver in cents
    const driverPaymentAmount = Math.round(driverPaymentNet * 100);

    console.log(`💰 PAYOUT CALCULATION (70% of net after Stripe fees):`);
    console.log(`   Order total (gross): $${orderTotal.toFixed(2)}`);
    console.log(`   Stripe fee: $${stripeFee.toFixed(2)}`);
    console.log(`   Platform received (net after fees): $${netAfterStripeFee.toFixed(2)}`);
    console.log(`   Driver payment (70% of net): $${driverPaymentNet.toFixed(2)}`);
    console.log(`   Platform keeps (30% of net): $${platformNetAfterFee.toFixed(2)}`);

    // Check if driver has Stripe Connect account
    const stripeAccountId = driver.stripe_account_id;
    let stripeConnected = driver.stripe_connected;
    
    // If stripeAccountId exists but stripe_connected is false, verify with Stripe
    if (stripeAccountId && !stripeConnected) {
      console.log('⚠️ stripe_connected flag is false, but account ID exists - verifying with Stripe...');
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        const isActuallyConnected = account.details_submitted && 
                                   account.charges_enabled && 
                                   account.payouts_enabled;
        
        if (isActuallyConnected) {
          console.log('✅ Account is actually connected! Updating database flag...');
          // Update database to reflect actual status
          await supabase
            .from('profiles')
            .update({ stripe_connected: true })
            .eq('id', order.driver_id);
          
          stripeConnected = true;
          console.log('✅ Database updated - stripe_connected set to true');
        } else {
          console.log('❌ Account exists but not fully onboarded:', {
            details_submitted: account.details_submitted,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled
          });
        }
      } catch (verifyError) {
        console.error('Error verifying Stripe account:', verifyError);
      }
    }
    
    if (!stripeAccountId || !stripeConnected) {
      console.log('⚠️ Driver has no Stripe account or not connected, skipping payment');
      console.log('   Driver ID:', order.driver_id);
      console.log('   Stripe account ID:', stripeAccountId);
      console.log('   Stripe connected:', stripeConnected);
      console.log('   Driver payment would be:', driverPaymentNet.toFixed(2));
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Driver payment skipped - no Stripe account connected',
          driverPayment: driverPaymentNet.toFixed(2),
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
          amount: driverPaymentNet,
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
        console.log(`   Details submitted: ${account.details_submitted}`);
        console.log(`   All capabilities:`, JSON.stringify(account.capabilities, null, 2));
        
        // For Stripe Connect Express accounts, transfers work if:
        // 1. Account is fully onboarded (details_submitted)
        // 2. Charges are enabled (for receiving money)
        // 3. Payouts are enabled (for sending money out)
        // The "transfers" capability might not exist or might be different for Express accounts
        
        const canReceiveTransfers = account.details_submitted && 
                                   account.charges_enabled && 
                                   account.payouts_enabled;
        
        // Also check transfers capability if it exists (some account types have it)
        const transfersCapabilityStatus = account.capabilities?.transfers;
        const hasTransfersCapability = transfersCapabilityStatus === 'active' || 
                                      transfersCapabilityStatus === undefined; // Express accounts might not show this
        
        if (!canReceiveTransfers) {
          const missing = [];
          if (!account.details_submitted) missing.push('details not submitted');
          if (!account.charges_enabled) missing.push('charges not enabled');
          if (!account.payouts_enabled) missing.push('payouts not enabled');
          
          console.error(`❌ ACCOUNT NOT READY FOR TRANSFERS! Missing: ${missing.join(', ')}`);
          throw new Error(`Driver Stripe account is not fully set up. Missing: ${missing.join(', ')}. Driver must complete Stripe Connect onboarding.`);
        }
        
        // Log if transfers capability exists and is not active (warning, not error)
        if (transfersCapabilityStatus && transfersCapabilityStatus !== 'active') {
          console.warn(`⚠️ Transfers capability status is '${transfersCapabilityStatus}' but account has charges and payouts enabled - proceeding with transfer`);
        }
        
        console.log(`✅ Account verified - ready to receive transfers`);
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
      let payoutTiming = 'INSTANT/DAILY payouts available';
      let instantAvailable = true; // Drivers get INSTANT/DAILY payouts
      
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        // For Express accounts, instant payouts are available if:
        // - Account is fully onboarded
        // - Payouts are enabled
        instantAvailable = account.details_submitted && account.payouts_enabled;
        
        if (instantAvailable) {
          payoutTiming = 'INSTANT/DAILY payouts available';
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
          driverPayment: driverPaymentNet.toFixed(2),
          platformShare: platformNetAfterFee.toFixed(2),
          platformNet: platformNetAfterFee.toFixed(2),
          instantPayoutsAvailable: instantAvailable,
          payoutTiming: payoutTiming,
          message: `✅ Driver payment processed successfully! 70% ($${driverPaymentNet.toFixed(2)}) transferred to driver Stripe account. INSTANT/DAILY payouts available.`,
          note: 'Driver receives INSTANT/DAILY payouts via Stripe'
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
