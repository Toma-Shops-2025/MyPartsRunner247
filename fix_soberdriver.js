// Run this in browser console to fix soberdrivertaxi@gmail.com as driver

console.log('🔧 Fixing soberdrivertaxi@gmail.com as driver...');

// Function to set user as driver
function fixSoberDriver() {
  console.log('Setting soberdrivertaxi@gmail.com as driver...');
  
  // Get current profile from localStorage
  const mockProfile = localStorage.getItem('mock_profile');
  if (mockProfile) {
    try {
      const profile = JSON.parse(mockProfile);
      if (profile.email === 'soberdrivertaxi@gmail.com') {
        // Update profile to driver
        profile.user_type = 'driver';
        profile.is_approved = true;
        profile.status = 'active';
        profile.updated_at = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('mock_profile', JSON.stringify(profile));
        console.log('✅ Updated profile to driver:', profile);
        
        // Reload page to apply changes
        console.log('🔄 Reloading page to apply changes...');
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error('Error parsing profile:', error);
    }
  }
  
  console.log('❌ Could not find profile for soberdrivertaxi@gmail.com');
}

// Function to show current profile
function showCurrentProfile() {
  const mockProfile = localStorage.getItem('mock_profile');
  if (mockProfile) {
    try {
      const profile = JSON.parse(mockProfile);
      console.log('Current Profile:', profile);
      return profile;
    } catch (error) {
      console.error('Error parsing profile from localStorage:', error);
    }
  }
  console.log('❌ No profile found in localStorage');
  return null;
}

// Usage instructions
console.log(`
🚀 USAGE INSTRUCTIONS:

1. Check current profile:
   showCurrentProfile()

2. Fix soberdrivertaxi@gmail.com as driver:
   fixSoberDriver()

📝 This will set the user as a driver and reload the page
`);

// Auto-detect and show current profile
const currentProfile = showCurrentProfile();
if (currentProfile && currentProfile.email === 'soberdrivertaxi@gmail.com') {
  console.log('🔍 Detected soberdrivertaxi@gmail.com. To fix as driver, run:');
  console.log('fixSoberDriver()');
}
