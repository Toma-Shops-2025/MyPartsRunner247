// Clear all broken profile data from localStorage
localStorage.removeItem('mock_profile');
localStorage.removeItem('fallback_user');
localStorage.removeItem('stripe_account_id');

console.log('✅ Cleared all broken profile data');
console.log('🔄 Please refresh the page and sign up again as a driver');
