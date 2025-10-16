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

// Function to fix all driver accounts at once
function fixAllDriverAccounts() {
  const driverEmails = [
    'tomashops578@gmail.com',
    'tomavault@gmail.com', 
    'timandmarciaadkins@gmail.com',
    'soberdrivertaxi@gmail.com',
    'tomaadkins533@gmail.com'
  ];
  
  console.log('🔧 Fixing all driver accounts...');
  driverEmails.forEach(email => {
    console.log(`Setting ${email} as driver`);
  });
  
  // Get current profile
  const currentProfile = showCurrentProfile();
  if (currentProfile && driverEmails.includes(currentProfile.email)) {
    setUserAsDriver(currentProfile.email);
  } else {
    console.log('❌ Current user is not in the driver list. Please log in with a driver account first.');
  }
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

2. Fix current user if they're a driver:
   fixAllDriverAccounts()

3. Set specific user as driver:
   setUserAsDriver('tomashops578@gmail.com')
   setUserAsDriver('tomavault@gmail.com')
   setUserAsDriver('timandmarciaadkins@gmail.com')
   setUserAsDriver('soberdrivertaxi@gmail.com')
   setUserAsDriver('tomaadkins533@gmail.com')

📝 Note: Only tomababyshopsonline@gmail.com should stay as customer
`);

// Auto-detect and show current profile
const currentProfile = showCurrentProfile();
if (currentProfile && currentProfile.user_type === 'customer') {
  console.log('🔍 Detected customer profile. To set as driver, run:');
  console.log(`setUserAsDriver('${currentProfile.email}')`);
}
