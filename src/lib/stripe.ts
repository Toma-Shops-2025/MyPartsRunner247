import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey || publishableKey === 'pk_test_placeholder') {
      console.warn('Stripe publishable key not configured');
      return null;
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Create payment intent using Stripe API directly
export const createPaymentIntent = async (amount: number, metadata: any) => {
  const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: 'usd',
        metadata: JSON.stringify(metadata),
        automatic_payment_methods: JSON.stringify({ enabled: true })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment intent creation error:', error);
    throw error;
  }
};

// Create Supabase client with service role key for server-side operations
export const createServiceRoleClient = () => {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Supabase service role key not configured');
  }

  // This would be used for server-side operations
  // For now, we'll use the regular client but this shows the pattern
  return {
    serviceRoleKey,
    // In a real server-side implementation, you'd create a Supabase client here
    // with the service role key for elevated permissions
  };
};
