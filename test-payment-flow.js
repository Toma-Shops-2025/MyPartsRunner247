// Test script to verify payment flow with connected driver
// Run this to test if Marcia McGregor can receive payments

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://vzynutgjvlwccpubbkwg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function testPaymentFlow() {
  console.log('🧪 Testing payment flow with connected driver...\n');
  
  try {
    // Get Marcia McGregor (the connected driver)
    const { data: marcia, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, stripe_account_id, stripe_connected')
      .eq('user_type', 'driver')
      .eq('stripe_connected', true)
      .single();
    
    if (error || !marcia) {
      console.error('❌ No connected driver found:', error);
      return;
    }
    
    console.log('✅ Found connected driver:');
    console.log(`   Name: ${marcia.full_name}`);
    console.log(`   Email: ${marcia.email}`);
    console.log(`   Stripe Account: ${marcia.stripe_account_id}`);
    console.log(`   Connected: ${marcia.connected}\n`);
    
    // Test payment intent creation
    console.log('🧪 Testing payment intent creation...');
    
    const testAmount = 100; // $100 test payment
    const metadata = {
      driverId: marcia.id,
      orderId: 'test-order-123',
      test: true
    };
    
    const response = await fetch('https://mypartsrunner.com/.netlify/functions/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: testAmount,
        metadata: metadata
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Payment intent created successfully!');
      console.log(`   Payment ID: ${result.id}`);
      console.log(`   Client Secret: ${result.client_secret.substring(0, 20)}...`);
      console.log('\n🎯 This payment should:');
      console.log('   - Transfer 70% ($70) to Marcia McGregor');
      console.log('   - Keep 30% ($30) as platform fee');
      console.log('   - Appear in both Stripe accounts');
    } else {
      const error = await response.json();
      console.error('❌ Payment intent creation failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentFlow();
