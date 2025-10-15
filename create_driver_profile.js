// Simple script to create a driver profile in localStorage
// Run this in the browser console to immediately create a driver profile

function createDriverProfile() {
  // Get current user info from the page
  const userEmail = 'timandmarciaadkins@gmail.com'; // Replace with actual email
  const userId = '67fbc308-9492-4e08-a00f-5c3f97a1872b'; // Replace with actual user ID
  
  const driverProfile = {
    id: userId,
    email: userEmail,
    full_name: 'Marcia', // Update with actual name
    phone: '5028122456', // Update with actual phone
    user_type: 'driver',
    is_online: true,
    is_approved: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Save to localStorage
  localStorage.setItem('mock_profile', JSON.stringify(driverProfile));
  
  console.log('Driver profile created:', driverProfile);
  console.log('Please refresh the page to see the changes.');
  
  return driverProfile;
}

// Make it available globally
window.createDriverProfile = createDriverProfile;

console.log('Driver profile creation function loaded. Run createDriverProfile() to create a driver profile.');
