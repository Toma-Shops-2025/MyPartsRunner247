const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  console.log('Payment intent function called');
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Event body:', event.body);
    const { amount, metadata } = JSON.parse(event.body);
    console.log('Parsed amount:', amount);
    console.log('Parsed metadata:', metadata);

    // Validate required fields
    if (!amount || amount <= 0) {
      console.log('Invalid amount error');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amount' })
      };
    }

    // Test Stripe connection first
    console.log('Testing Stripe connection...');
    try {
      const account = await stripe.accounts.retrieve();
      console.log('Stripe account retrieved successfully:', account.id);
    } catch (accountError) {
      console.error('Stripe account retrieval failed:', accountError);
      throw new Error('Stripe connection failed: ' + accountError.message);
    }

    // Create payment intent with driver payout
    console.log('Creating payment intent with amount:', Math.round(amount * 100));
    
    // Extract driver ID from metadata
    const driverId = metadata?.driverId;
    let paymentIntent;
    
    if (driverId) {
      // Get driver's Stripe Connect account ID
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: driverProfile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', driverId)
        .single();
      
      if (driverProfile?.stripe_account_id) {
        // Calculate Stripe fee first (2.9% + 30¢)
        const stripeFee = (amount * 0.029) + 0.30;
        const netAfterStripeFee = amount - stripeFee;
        
        // Driver gets 70% of net after Stripe fees, Platform gets 30%
        const driverAmountNet = netAfterStripeFee * 0.70;
        const platformShareNet = netAfterStripeFee * 0.30;
        
        // Convert to cents for Stripe
        const platformFee = Math.round(platformShareNet * 100); // Platform fee (30% of net)
        const driverAmount = Math.round(driverAmountNet * 100); // 70% of net to driver
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          application_fee_amount: platformFee,
          transfer_data: {
            destination: driverProfile.stripe_account_id
          },
          metadata: {
            ...metadata,
            driver_stripe_account: driverProfile.stripe_account_id,
            platform_fee: platformFee,
            driver_amount: driverAmount
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });
        
        console.log(`Payment intent created with transfer to driver ${driverId}: ${driverProfile.stripe_account_id}`);
      } else {
        console.warn(`Driver ${driverId} has no Stripe Connect account, creating payment to platform account`);
        // Fallback: create payment to platform account
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          metadata: {
            ...metadata,
            warning: 'Driver has no Stripe Connect account - payment to platform'
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });
      }
    } else {
      // No driver specified, create payment to platform account
      console.log('No driver ID provided, creating payment to platform account');
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });
    }
    console.log('Payment intent created successfully:', paymentIntent.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        client_secret: paymentIntent.client_secret,
        id: paymentIntent.id
      })
    };
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create payment intent',
        message: error.message 
      })
    };
  }
};
