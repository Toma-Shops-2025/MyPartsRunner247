// Diagnostic script to check driver Stripe Connect status
// Run this in Supabase SQL Editor or Node.js environment

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://vzynutgjvlwccpubbkwg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function checkDriverStripeStatus() {
  console.log('🔍 Checking driver Stripe Connect status...\n');
  
  try {
    // Get all drivers
    const { data: drivers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, stripe_account_id, stripe_connected, created_at')
      .eq('user_type', 'driver')
      .order('created_at', 'desc');
    
    if (error) {
      console.error('❌ Error fetching drivers:', error);
      return;
    }
    
    console.log(`📊 Found ${drivers.length} drivers:\n`);
    
    drivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.full_name || 'No name'} (${driver.email})`);
      console.log(`   ID: ${driver.id}`);
      console.log(`   Stripe Account ID: ${driver.stripe_account_id || '❌ NOT SET'}`);
      console.log(`   Stripe Connected: ${driver.stripe_connected ? '✅ YES' : '❌ NO'}`);
      console.log(`   Created: ${new Date(driver.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Summary
    const withStripeAccount = drivers.filter(d => d.stripe_account_id).length;
    const connected = drivers.filter(d => d.stripe_connected).length;
    
    console.log('📈 SUMMARY:');
    console.log(`   Total Drivers: ${drivers.length}`);
    console.log(`   With Stripe Account: ${withStripeAccount}`);
    console.log(`   Connected to Stripe: ${connected}`);
    console.log(`   Missing Stripe Setup: ${drivers.length - withStripeAccount}`);
    
    if (withStripeAccount === 0) {
      console.log('\n🚨 CRITICAL ISSUE: No drivers have Stripe Connect accounts!');
      console.log('   This means all payments are going to your account instead of drivers.');
      console.log('   Solution: Complete Stripe Connect platform onboarding first.');
    } else if (connected === 0) {
      console.log('\n⚠️  WARNING: Drivers have Stripe accounts but are not connected.');
      console.log('   They need to complete the onboarding process.');
    } else {
      console.log('\n✅ Good: Drivers have Stripe Connect accounts and are connected.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkDriverStripeStatus();
