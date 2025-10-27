// Script to check if you're using Stripe test mode or live mode
// This will help determine why you haven't seen deposits

console.log('🔍 Checking Stripe Mode...\n');

// Check environment variables (you'll need to run this with your actual keys)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key';

if (stripeSecretKey.startsWith('sk_test_')) {
  console.log('🧪 STRIPE TEST MODE DETECTED');
  console.log('   This explains why you haven\'t seen deposits!');
  console.log('   Test payments don\'t create real money transfers.');
  console.log('');
  console.log('📊 What to check:');
  console.log('   1. Go to https://dashboard.stripe.com/test/payments');
  console.log('   2. Look for test transactions');
  console.log('   3. Check if payments are being processed');
  console.log('');
  console.log('🔄 To switch to live mode:');
  console.log('   1. Get live keys from Stripe Dashboard');
  console.log('   2. Update environment variables');
  console.log('   3. Redeploy to Netlify');
} else if (stripeSecretKey.startsWith('sk_live_')) {
  console.log('💰 STRIPE LIVE MODE DETECTED');
  console.log('   You should be seeing real deposits!');
  console.log('');
  console.log('📊 What to check:');
  console.log('   1. Go to https://dashboard.stripe.com/payments');
  console.log('   2. Look for recent transactions');
  console.log('   3. Check Connect → Accounts for driver payouts');
  console.log('   4. Look for transfers to driver accounts');
} else {
  console.log('❌ INVALID STRIPE KEY');
  console.log('   Your Stripe key doesn\'t start with sk_test_ or sk_live_');
  console.log('   Please check your environment variables.');
}

console.log('\n🎯 Next Steps:');
console.log('   1. Check Stripe Dashboard for transactions');
console.log('   2. Look for any orders that have been processed');
console.log('   3. Verify payment flow is working end-to-end');
