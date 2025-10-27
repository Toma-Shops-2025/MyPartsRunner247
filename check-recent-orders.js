// Script to check for recent orders and payments
// Run this to see if any orders have been processed

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://vzynutgjvlwccpubbkwg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function checkRecentOrders() {
  console.log('🔍 Checking for recent orders and payments...\n');
  
  try {
    // Check for recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_id, driver_id, total, status, created_at, updated_at')
      .order('created_at', 'desc')
      .limit(10);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    console.log(`📦 Found ${orders.length} recent orders:\n`);
    
    if (orders.length === 0) {
      console.log('❌ NO ORDERS FOUND');
      console.log('   This explains why you haven\'t seen deposits!');
      console.log('   No orders = No payments = No deposits');
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('   1. Create a test order');
      console.log('   2. Assign it to a connected driver');
      console.log('   3. Process the payment');
      console.log('   4. Check Stripe Dashboard for the transaction');
      return;
    }
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.id}`);
      console.log(`   Amount: $${order.total}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Driver ID: ${order.driver_id}`);
      console.log(`   Created: ${new Date(order.created_at).toLocaleDateString()}`);
      console.log(`   Updated: ${new Date(order.updated_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Check for completed orders
    const completedOrders = orders.filter(order => order.status === 'completed');
    console.log(`✅ Completed orders: ${completedOrders.length}`);
    
    if (completedOrders.length > 0) {
      console.log('\n🎯 These completed orders should have generated payments:');
      completedOrders.forEach(order => {
        console.log(`   - Order ${order.id}: $${order.total} (Driver: ${order.driver_id})`);
      });
      console.log('\n💡 Check Stripe Dashboard for these transactions!');
    } else {
      console.log('\n⚠️  No completed orders found');
      console.log('   Orders need to be marked as "completed" to trigger payments');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkRecentOrders();
