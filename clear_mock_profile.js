// Clear mock profile from localStorage to fix customer getting driver access
// Run this in browser console to clear the stored profile

console.log('Clearing mock profile from localStorage...');
localStorage.removeItem('mock_profile');
localStorage.removeItem('fallback_user');
console.log('Mock profile cleared! Please refresh the page.');

// Also clear any other stored auth data
localStorage.removeItem('supabase.auth.token');
sessionStorage.removeItem('supabase.auth.token');
console.log('All auth data cleared. Please refresh the page.');
