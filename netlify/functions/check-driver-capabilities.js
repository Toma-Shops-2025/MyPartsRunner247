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
    
    // For Express accounts, transfers work based on charges_enabled and payouts_enabled
    // The "transfers" capability might not exist or be needed for Express accounts
    const transfersEnabled = account.charges_enabled && account.payouts_enabled;
    const cardPaymentsEnabled = capabilities.card_payments === 'active';
    const chargesEnabled = account.charges_enabled;

    // Check if account is fully onboarded (this is what enables transfers for Express accounts)
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
      canReceiveTransfers: isFullyOnboarded, // Express accounts can receive transfers if fully onboarded
      capabilities: {
        transfers: {
          status: capabilities.transfers || (isFullyOnboarded ? 'active (via charges/payouts)' : 'inactive'),
          enabled: transfersEnabled,
          required: true,
          note: 'For Express accounts, transfers work via charges_enabled and payouts_enabled'
        },
        card_payments: {
          status: capabilities.card_payments || 'not_requested',
          enabled: cardPaymentsEnabled,
          required: false // Not strictly required for receiving transfers
        }
      },
      needsAction: [],
      recommendations: []
    };

    // Determine what actions are needed
    if (!account.details_submitted) {
      accountStatus.needsAction.push('Complete Stripe Connect onboarding - submit details');
      accountStatus.recommendations.push('Driver must complete all required information in Stripe');
    }
    
    if (!account.charges_enabled) {
      accountStatus.needsAction.push('Enable charges in Stripe account');
      accountStatus.recommendations.push('Charges must be enabled to receive transfers');
    }
    
    if (!account.payouts_enabled) {
      accountStatus.needsAction.push('Enable payouts in Stripe account');
      accountStatus.recommendations.push('Payouts must be enabled to receive transfers');
    }

    if (!isFullyOnboarded) {
      accountStatus.recommendations.push('Driver must complete Stripe Connect onboarding to receive payments');
    }

    // Note about transfers capability (might not exist for Express accounts)
    if (capabilities.transfers && capabilities.transfers !== 'active') {
      accountStatus.recommendations.push(`Transfers capability status: ${capabilities.transfers} (may not be needed for Express accounts if charges/payouts are enabled)`);
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

