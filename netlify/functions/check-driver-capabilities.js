// Check Driver Stripe Account Capabilities
// Verifies if a driver's Stripe Connect account has required capabilities enabled

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
        statusCode: 200,
        body: JSON.stringify({
          hasAccount: false,
          message: 'Driver has no Stripe Connect account',
          action: 'Driver needs to create Stripe Connect account first'
        })
      };
    }

    // Retrieve Stripe account to check capabilities
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Check required capabilities
    const capabilities = account.capabilities || {};
    const transfersEnabled = capabilities.transfers === 'active';
    const cardPaymentsEnabled = capabilities.card_payments === 'active';
    const chargesEnabled = capabilities.card_payments === 'active';

    // Check if account is fully onboarded
    const isFullyOnboarded = account.details_submitted && 
                             account.charges_enabled && 
                             account.payouts_enabled;

    // Get account status
    const accountStatus = {
      hasAccount: true,
      accountId: stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      isFullyOnboarded: isFullyOnboarded,
      capabilities: {
        transfers: {
          status: capabilities.transfers || 'not_requested',
          enabled: transfersEnabled,
          required: true
        },
        card_payments: {
          status: capabilities.card_payments || 'not_requested',
          enabled: cardPaymentsEnabled,
          required: true
        }
      },
      needsAction: [],
      recommendations: []
    };

    // Determine what actions are needed
    if (!isFullyOnboarded) {
      accountStatus.needsAction.push('Complete Stripe Connect onboarding');
      accountStatus.recommendations.push('Driver must complete onboarding to receive payments');
    }

    if (!transfersEnabled) {
      accountStatus.needsAction.push('Enable transfers capability');
      accountStatus.recommendations.push('Transfers capability is required for driver payouts');
      
      // Check if it's pending or inactive
      if (capabilities.transfers === 'pending') {
        accountStatus.recommendations.push('Transfers capability is pending review by Stripe');
      } else if (capabilities.transfers === 'inactive') {
        accountStatus.recommendations.push('Transfers capability was declined. Contact Stripe support.');
      } else {
        accountStatus.recommendations.push('Request transfers capability to be enabled');
      }
    }

    if (!cardPaymentsEnabled && capabilities.card_payments === 'pending') {
      accountStatus.needsAction.push('Wait for card_payments capability approval');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(accountStatus)
    };

  } catch (error) {
    console.error('Error checking driver capabilities:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to check driver capabilities',
        details: error.message 
      })
    };
  }
};

