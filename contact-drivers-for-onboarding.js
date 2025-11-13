// Script to generate contact information for drivers who need to complete Stripe onboarding
// Use this to send them instructions

const drivers = [
  {
    name: 'TomaVault',
    email: 'tomavault@gmail.com',
    stripe_account_id: 'acct_1SK9Fo5tUyEyScan',
    connected: false
  },
  {
    name: 'Sober Driver',
    email: 'soberdrivertaxi@gmail.com',
    stripe_account_id: 'acct_1SK96V9SqLZvktil',
    connected: false
  },
  {
    name: 'TomaShops',
    email: 'tomashops578@gmail.com',
    stripe_account_id: 'acct_1SK9M34nvyodocmn',
    connected: false
  }
];

function generateContactInfo() {
  console.log('📧 Contact Information for Drivers Needing Stripe Onboarding\n');
  
  drivers.forEach((driver, index) => {
    console.log(`${index + 1}. ${driver.name}`);
    console.log(`   Email: ${driver.email}`);
    console.log(`   Stripe Account: ${driver.stripe_account_id}`);
    console.log(`   Status: ❌ Needs to complete onboarding`);
    console.log('');
  });
  
  console.log('📝 Email Template:');
  console.log('Subject: Complete Your Payment Setup - MY-RUNNER.COM');
  console.log('');
  console.log('Hi [Driver Name],');
  console.log('');
  console.log('Your MY-RUNNER.COM driver account is almost ready! You just need to complete your payment setup so you can receive automatic payments for deliveries.');
  console.log('');
  console.log('To complete your setup:');
  console.log('1. Go to https://mypartsrunner.com/driver-dashboard');
  console.log('2. Login with your credentials');
  console.log('3. Click "Complete Payment Setup"');
  console.log('4. Follow the Stripe onboarding process');
  console.log('5. Add your bank account or debit card');
  console.log('');
  console.log('Once completed, you\'ll receive 70% of each delivery automatically!');
  console.log('');
  console.log('If you have any issues, please contact support.');
  console.log('');
  console.log('Thanks!');
  console.log('MY-RUNNER.COM Team');
  console.log('');
  console.log('---');
  console.log('');
}

// Run the script
generateContactInfo();
