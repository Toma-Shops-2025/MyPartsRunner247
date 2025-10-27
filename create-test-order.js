// Script to create a test order and verify payment flow
// This will help test if the payment system is working

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://vzynutgjvlwccpubbkwg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function createTestOrder() {
  console.log('🧪 Creating test order to verify payment flow...\n');
  
  try {
    // Get a connected driver (Marcia McGregor)
    const { data: driver, error: driverError } = await supabase
      .from('profiles')
      .select('id, full_name, email, stripe_account_id, stripe_connected')
      .eq('user_type', 'driver')
      .eq('stripe_connected', true)
      .single();
    
    if (driverError || !driver) {
      console.error('❌ No connected driver found:', driverError);
      return;
    }
    
    console.log('✅ Using connected driver:');
    console.log(`   Name: ${driver.full_name}`);
    console.log(`   Email: ${driver.email}`);
    console.log(`   Stripe Account: ${driver.stripe_account_id}`);
    console.log('');
    
    // Create a test order
    const testOrder = {
      customer_id: 'test-customer-123',
      driver_id: driver.id,
      pickup_address: '123 Test Street, Test City, TS 12345',
      delivery_address: '456 Delivery Ave, Test City, TS 12345',
      item_description: 'Test delivery for payment verification',
      total: 50.00, // $50 test order
      status: 'pending',
      contact_phone: '555-123-4567',
      special_instructions: 'Test order - please verify payment flow'
    };
    
    console.log('📦 Creating test order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return;
    }
    
    console.log('✅ Test order created successfully!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Amount: $${order.total}`);
    console.log(`   Driver: ${driver.full_name}`);
    console.log('');
    
    // Now test payment intent creation
    console.log('💳 Testing payment intent creation...');
    
    const response = await fetch('https://mypartsrunner.com/.netlify/functions/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: order.total,
        metadata: {
          orderId: order.id,
          driverId: driver.id,
          test: true
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Payment intent created successfully!');
      console.log(`   Payment ID: ${result.id}`);
      console.log(`   Client Secret: ${result.client_secret.substring(0, 20)}...`);
      console.log('');
      console.log('🎯 This payment should:');
      console.log('   - Transfer 70% ($35) to driver account');
      console.log('   - Keep 30% ($15) as platform fee');
      console.log('   - Appear in Stripe Dashboard');
      console.log('');
      console.log('📊 Next Steps:');
      console.log('   1. Check Stripe Dashboard for this transaction');
      console.log('   2. Look for transfers to driver account');
      console.log('   3. Verify platform fee collection');
    } else {
      const error = await response.json();
      console.error('❌ Payment intent creation failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
createTestOrder();
