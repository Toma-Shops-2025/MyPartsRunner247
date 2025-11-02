const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { driverId, email, name } = JSON.parse(event.body);
    
    if (!driverId || !email || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Driver ID, email, and name are required' })
      };
    }

    // Create Stripe Connect Express account for driver
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // Allows instant payouts when driver has debit card
            // Note: Instant payouts require driver to add debit card in Stripe
          }
        }
      },
      business_type: 'individual',
      individual: {
        email: email,
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || ''
      }
    });

    // Create account link for driver onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL}/driver-dashboard?refresh=true`,
      return_url: `${process.env.VITE_APP_URL}/driver-dashboard?success=true`,
      type: 'account_onboarding'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        accountId: account.id,
        onboardingUrl: accountLink.url
      })
    };

  } catch (error) {
    console.error('Error creating driver account:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to create driver account',
        details: error.message 
      })
    };
  }
};
