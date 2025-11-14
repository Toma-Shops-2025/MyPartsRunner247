// Generate VAPID keys for push notifications
// Run with: node generate-vapid-keys.cjs

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('='.repeat(60));
console.log('📋 Add these to your Netlify environment variables:\n');

console.log('Frontend (Public Key):');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`);

console.log('Backend (Public Key - can be same as frontend):');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`);

console.log('Backend (Private Key - KEEP SECRET!):');
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);

console.log('='.repeat(60));
console.log('\n📝 Instructions:');
console.log('1. Copy each variable above');
console.log('2. Go to Netlify → Site settings → Environment variables');
console.log('3. Add each variable with its value');
console.log('4. Set scope to "All scopes" or "Production"');
console.log('5. Save and redeploy your site');
console.log('\n⚠️  IMPORTANT: Never commit the private key to Git!');
console.log('⚠️  The private key should only be in Netlify environment variables.\n');

console.log('🔗 VAPID Details (used in send-driver-push.js):');
console.log(`   Email: support@my-runner.com (or your support email)`);
console.log(`   Public Key: ${vapidKeys.publicKey}`);
console.log(`   Private Key: ${vapidKeys.privateKey.substring(0, 20)}... (hidden)\n`);

