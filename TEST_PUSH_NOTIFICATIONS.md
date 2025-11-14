# How to Test Push Notifications

This guide shows you how to enable and test push notifications in MY-RUNNER.COM.

## 🎯 **Method 1: Enable Through UI (Recommended)**

### For Drivers:
1. **Sign in** to your account (must be a driver account)
2. Go to **Driver Dashboard** (`/driver-dashboard`)
3. Look for the yellow banner: **"Enable instant driver alerts"**
4. Click the **"Enable Push Alerts"** button
5. Allow notifications when the browser prompts you

### For Customers:
- Push notifications are currently only available for drivers
- You'll see notification settings in your Profile page, but push notifications require the driver dashboard

---

## 🔧 **Method 2: Test from Browser Console**

Open your browser console (F12) and run these commands:

### Step 1: Check if Push is Supported

```javascript
// Check if push notifications are supported
const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
console.log('Push supported:', isSupported);
```

### Step 2: Request Notification Permission

```javascript
// Request notification permission
Notification.requestPermission().then(permission => {
  console.log('Notification permission:', permission);
  if (permission === 'granted') {
    console.log('✅ Permission granted!');
  } else {
    console.log('❌ Permission denied');
  }
});
```

### Step 3: Check Service Worker

```javascript
// Check if service worker is registered
navigator.serviceWorker.ready.then(registration => {
  console.log('Service worker ready:', registration);
  console.log('Push manager available:', 'PushManager' in window);
});
```

### Step 4: Check VAPID Key

```javascript
// Check if VAPID key is set
const vapidKey = import.meta?.env?.VITE_VAPID_PUBLIC_KEY || 'Not found';
console.log('VAPID Public Key:', vapidKey);
```

### Step 5: Subscribe to Push (Manual)

```javascript
// Manual subscription (if you have the VAPID key)
async function subscribeToPushManually() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY_HERE')
    });
    console.log('✅ Subscription successful:', subscription);
    console.log('Subscription endpoint:', subscription.endpoint);
  } catch (error) {
    console.error('❌ Subscription failed:', error);
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Uncomment to test:
// subscribeToPushManually();
```

---

## 🧪 **Method 3: Send Test Notification from Console**

After subscribing, you can send a test notification:

```javascript
// Send a test notification
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Test Notification', {
    body: 'This is a test notification from MY-RUNNER.COM!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    tag: 'test-notification',
    requireInteraction: false
  });
  console.log('✅ Test notification sent!');
});
```

---

## 🔍 **Debugging: Check Current Status**

Run this in the console to check everything:

```javascript
// Complete status check
async function checkPushStatus() {
  console.log('=== Push Notification Status ===');
  
  // 1. Check support
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
  console.log('1. Push supported:', isSupported);
  
  // 2. Check permission
  console.log('2. Notification permission:', Notification.permission);
  
  // 3. Check service worker
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('3. Service worker ready:', !!registration);
    
    // 4. Check subscription
    const subscription = await registration.pushManager.getSubscription();
    console.log('4. Active subscription:', !!subscription);
    if (subscription) {
      console.log('   Endpoint:', subscription.endpoint);
      console.log('   Keys:', subscription.toJSON().keys);
    }
  } catch (error) {
    console.error('3. Service worker error:', error);
  }
  
  // 5. Check VAPID key (if accessible)
  try {
    // This won't work directly in console, but you can check network tab
    console.log('5. Check VAPID key in Network tab or app code');
  } catch (error) {
    console.log('5. Cannot check VAPID key from console');
  }
  
  console.log('=== End Status ===');
}

// Run the check
checkPushStatus();
```

---

## ❓ **Troubleshooting**

### "Push notifications are not supported"
- **Solution:** Use a modern browser (Chrome, Firefox, Edge, Safari)
- Make sure you're on HTTPS or localhost

### "Permission denied"
- **Solution:** Click the notification icon in your browser's address bar
- Go to Site Settings → Notifications → Allow

### "Service worker not registered"
- **Solution:** Refresh the page
- Check that `/sw.js` is accessible: `https://my-runner.com/sw.js`

### "Missing VITE_VAPID_PUBLIC_KEY"
- **Solution:** Verify VAPID keys are set in Netlify environment variables
- Redeploy after adding variables

### "Failed to enable push notifications"
- **Solution:** Check browser console for detailed error
- Verify you're logged in
- Check Network tab for failed requests

---

## 📝 **Quick Test Commands**

Copy and paste these into the console:

```javascript
// Quick permission check
console.log('Permission:', Notification.permission);

// Request permission
Notification.requestPermission();

// Check service worker
navigator.serviceWorker.ready.then(r => console.log('SW ready:', !!r));

// Send test notification
navigator.serviceWorker.ready.then(r => 
  r.showNotification('Test', { body: 'Hello from MY-RUNNER.COM!' })
);
```

---

## 🎯 **After Enabling**

Once push notifications are enabled:

1. You'll receive notifications for:
   - New orders assigned to you
   - Order updates
   - Earnings updates
   - System alerts

2. Check subscription in database:
   - Log into Supabase
   - Check `push_subscriptions` table
   - You should see your subscription with endpoint and keys

3. Test sending a notification:
   - Use the Netlify function: `/.netlify/functions/send-driver-push`
   - Or trigger from your app when an event occurs

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

