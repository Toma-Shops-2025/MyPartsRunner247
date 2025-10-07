# Stripe Payment Integration Setup

## Required Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Mapbox Configuration (for location features)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

## Getting Your Stripe Keys

1. **Sign up for Stripe**: Go to [stripe.com](https://stripe.com) and create an account
2. **Get Test Keys**: 
   - Go to Dashboard → Developers → API Keys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)
3. **Add to Environment**: Add both keys to your `.env` file

## Testing Payments

### Test Card Numbers (Stripe Test Mode):
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Details:
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

## Production Setup

When ready for production:

1. **Switch to Live Keys**: Replace test keys with live keys from Stripe Dashboard
2. **Update Environment**: Change `pk_test_` to `pk_live_` and `sk_test_` to `sk_live_`
3. **Webhook Setup**: Configure webhooks for payment confirmations
4. **Security**: Never commit secret keys to version control

## Features Implemented

✅ **Real Stripe Payment Processing**
- Payment intent creation
- Card payment confirmation
- Order creation with payment tracking
- Error handling and user feedback

✅ **Fallback Demo Mode**
- Works without Stripe configuration
- Simulates payment processing
- Perfect for development and testing

## Security Notes

- Secret keys are only used server-side (in the payment intent creation)
- Publishable keys are safe to use client-side
- All payment data is handled securely by Stripe
- No sensitive payment information is stored in your database
