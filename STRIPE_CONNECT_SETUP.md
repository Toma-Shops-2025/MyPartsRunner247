# Stripe Connect Setup Issue Fix

## Problem
When drivers try to connect their payment method, they get this error:
> "You must complete your platform profile to use Connect/accounts/overview to answer the questionnaire."

## Root Cause
Stripe Connect requires the platform (MyPartsRunner) to complete their own onboarding before drivers can create accounts.

## Solution

### 1. Complete Platform Onboarding
1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Navigate to Connect**: Go to "Connect" → "Settings" → "Platform profile"
3. **Complete Questionnaire**: Fill out all required information about your platform
4. **Submit for Review**: Stripe will review your platform profile

### 2. Required Information for Platform Profile
- **Business Information**: Company name, address, tax ID
- **Platform Description**: What your platform does
- **Business Model**: How you make money
- **User Base**: Who uses your platform
- **Compliance**: Anti-money laundering, KYC procedures

### 3. Alternative: Use Stripe Test Mode
For development/testing, you can:
1. **Use Test Keys**: Ensure you're using `sk_test_` and `pk_test_` keys
2. **Test Mode Only**: Stripe Connect works differently in test mode
3. **Mock Integration**: Consider implementing a mock payment system for development

### 4. Environment Variables Check
Ensure these are set in Netlify:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 5. Temporary Workaround
Until Stripe Connect is fully set up, you can:
1. **Disable the button**: Hide the Stripe Connect button temporarily
2. **Show message**: Display "Payment setup coming soon"
3. **Manual payments**: Process driver payments manually

## Status
- ✅ Stripe Connect button is now visible on driver dashboard
- ❌ Platform profile needs to be completed in Stripe Dashboard
- ⏳ Once completed, drivers will be able to connect their payment methods

## Next Steps
1. Complete Stripe platform profile in dashboard
2. Wait for Stripe approval (usually 1-2 business days)
3. Test driver account creation
4. Verify payment processing works end-to-end
