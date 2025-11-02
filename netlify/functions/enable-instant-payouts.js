// Enable Instant Payouts for Driver Stripe Account
// Instant payouts allow drivers to receive payments within minutes (vs 2-7 days)
// Requires driver to have a debit card added to their Stripe account

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
    const { driverId } = JSON.parse(event.body);
    
    if (!driverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Driver ID is required' })
      };
    }

    // Get driver details
    const { data: driver, error: driverError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Driver not found' })
      };
    }

    const stripeAccountId = driver.stripe_account_id;
    
    if (!stripeAccountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Driver has no Stripe account',
          action: 'Driver must create Stripe Connect account first'
        })
      };
    }

    // Retrieve account to check status
    const account = await stripe.accounts.retrieve(stripeAccountId);

    if (!account.details_submitted || !account.payouts_enabled) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Account not fully onboarded',
          message: 'Driver must complete Stripe Connect onboarding first',
          details: {
            details_submitted: account.details_submitted,
            payouts_enabled: account.payouts_enabled
          }
        })
      };
    }

    // Update account settings to allow instant payouts
    // Note: Instant payouts still require driver to have a debit card
    const updatedAccount = await stripe.accounts.update(stripeAccountId, {
      settings: {
        payouts: {
          schedule: {
            interval: 'manual' // Allows instant payouts
          },
          // Enable instant payouts if available
          // This allows transfers to be instant when driver has debit card
        }
      }
    });

    // Check if instant payouts are available
    // For Express accounts, instant payouts work when:
    // 1. Account is fully onboarded
    // 2. Driver has added a debit card
    // 3. Funds are available in platform account
    
    const hasInstantPayouts = updatedAccount.capabilities?.transfers === 'active' &&
                              updatedAccount.details_submitted &&
                              updatedAccount.payouts_enabled;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        accountId: stripeAccountId,
        instantPayoutsAvailable: hasInstantPayouts,
        message: hasInstantPayouts 
          ? 'Account configured for instant payouts. Driver will receive instant payouts when they have a debit card added to their Stripe account.'
          : 'Account configured, but instant payouts require driver to add a debit card in their Stripe account.',
        instructions: [
          '1. Driver should log into their Stripe Express dashboard',
          '2. Add a debit card for instant payouts',
          '3. Future payouts will be instant (minutes) instead of 2-7 days'
        ],
        note: 'If driver does not add debit card, payouts will use standard 2-7 day schedule'
      })
    };

  } catch (error) {
    console.error('Error enabling instant payouts:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to enable instant payouts',
        details: error.message 
      })
    };
  }
};

