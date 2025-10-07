# Stripe Payment Integration Setup

## Required Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

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

- **Secret keys** (`STRIPE_SECRET_KEY`) are server-side only and never exposed to client
- **Publishable keys** (`VITE_STRIPE_PUBLISHABLE_KEY`) are safe to use client-side
- All payment data is handled securely by Stripe
- No sensitive payment information is stored in your database

## Environment Variable Security

### ✅ **Safe for Client-Side (VITE_ prefix):**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Safe to expose
- `VITE_MAPBOX_ACCESS_TOKEN` - Safe to expose
- `VITE_SUPABASE_ANON_KEY` - Safe to expose

### 🔒 **Server-Side Only (NO VITE_ prefix):**
- `STRIPE_SECRET_KEY` - **NEVER** expose to client
- `STRIPE_WEBHOOK_SECRET` - **NEVER** expose to client
- `SUPABASE_SERVICE_ROLE_KEY` - **NEVER** expose to client

## Getting Your Supabase Service Role Key

1. **Go to Supabase Dashboard**: Navigate to your project
2. **Settings → API**: Click on the API section
3. **Copy Service Role Key**: Look for the `service_role` key (starts with `eyJ...`)
4. **Add to Environment**: Add as `SUPABASE_SERVICE_ROLE_KEY` in Netlify

⚠️ **Important**: The service role key has full database access and bypasses Row Level Security (RLS). Keep it secure and never expose it to client-side code.
