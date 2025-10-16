// Script to fix driver accounts that are showing as customers
// Run this in browser console to manually set driver accounts

console.log('🔧 Driver Account Fix Script');
console.log('This script will help you set driver accounts back to driver status');

// Function to set a user as driver
function setUserAsDriver(userEmail) {
  console.log(`Setting ${userEmail} as driver...`);
  
  // Get current profile from localStorage
  const mockProfile = localStorage.getItem('mock_profile');
  if (mockProfile) {
    try {
      const profile = JSON.parse(mockProfile);
      if (profile.email === userEmail) {
        // Update profile to driver
        profile.user_type = 'driver';
        profile.is_online = true;
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
  
  console.log('❌ Could not find profile for', userEmail);
}

// Function to list current profile
function showCurrentProfile() {
  const mockProfile = localStorage.getItem('mock_profile');
  if (mockProfile) {
    try {
      const profile = JSON.parse(mockProfile);
      console.log('📋 Current Profile:', profile);
      return profile;
    } catch (error) {
      console.error('Error parsing profile:', error);
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

2. Set current user as driver:
   setUserAsDriver('your-email@example.com')

3. Example for specific email:
   setUserAsDriver('driver@example.com')

📝 Note: Replace 'your-email@example.com' with the actual email address
`);

// Auto-detect and show current profile
const currentProfile = showCurrentProfile();
if (currentProfile && currentProfile.user_type === 'customer') {
  console.log('🔍 Detected customer profile. To set as driver, run:');
  console.log(`setUserAsDriver('${currentProfile.email}')`);
}
