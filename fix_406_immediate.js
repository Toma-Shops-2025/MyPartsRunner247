// IMMEDIATE FIX for 406 error - Run this in browser console

console.log('🔧 Fixing 406 Database Error...');

// Function to clear all auth data and force fresh start
function clearAllAuthData() {
  console.log('🧹 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('supabase.auth.token');
  localStorage.removeItem('mock_profile');
  localStorage.removeItem('fallback_user');
  localStorage.removeItem('stripe_account_id');
  
  // Clear sessionStorage
  sessionStorage.removeItem('supabase.auth.token');
  sessionStorage.removeItem('sw-updated');
  
  console.log('✅ All auth data cleared');
}

// Function to create a manual driver profile
function createManualDriverProfile() {
  console.log('👤 Creating manual driver profile...');
  
  // Get current user info
  const currentUser = {
    id: 'temp_user_' + Date.now(),
    email: 'soberdrivertaxi@gmail.com',
    user_metadata: {
      full_name: 'Driver User',
      phone: '555-1234',
      user_type: 'driver'
    }
  };
  
  // Create fallback user
  localStorage.setItem('fallback_user', JSON.stringify(currentUser));
  
  // Create driver profile
  const driverProfile = {
    id: currentUser.id,
    email: currentUser.email,
    full_name: currentUser.user_metadata.full_name,
    phone: currentUser.user_metadata.phone,
    user_type: 'driver',
    is_approved: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  localStorage.setItem('mock_profile', JSON.stringify(driverProfile));
  
  console.log('✅ Driver profile created:', driverProfile);
  
  // Reload page
  console.log('🔄 Reloading page...');
  window.location.reload();
}

// Function to test database connection
function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  // This will help identify if it's a network issue or RLS issue
  fetch('https://vzynutgjvlwccpubbkwg.supabase.co/rest/v1/profiles?select=*&limit=1', {
    method: 'GET',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eW51dGdqdndjY3B1YmJrd2ciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDQ0NzQ0MCwiZXhwIjoyMDUwMDIzNDQwfQ.7QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eW51dGdqdndjY3B1YmJrd2ciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDQ0NzQ0MCwiZXhwIjoyMDUwMDIzNDQwfQ.7QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q'
    }
  })
  .then(response => {
    console.log('📡 Database response status:', response.status);
    if (response.status === 200) {
      console.log('✅ Database connection working');
    } else {
      console.log('❌ Database connection failed:', response.status);
    }
    return response.text();
  })
  .then(data => {
    console.log('📋 Database response:', data);
  })
  .catch(error => {
    console.error('❌ Database connection error:', error);
  });
}

// Usage instructions
console.log(`
🚀 IMMEDIATE FIX OPTIONS:

1. Clear all auth data and start fresh:
   clearAllAuthData()

2. Create manual driver profile:
   createManualDriverProfile()

3. Test database connection:
   testDatabaseConnection()

📝 The 406 error suggests RLS (Row Level Security) policy issues
📝 Run the SQL script in Supabase to fix database policies
📝 Or use the manual profile creation as a workaround
`);

// Auto-run database test
testDatabaseConnection();
