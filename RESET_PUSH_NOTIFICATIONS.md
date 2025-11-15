# Reset Push Notifications - Start Fresh Setup

This guide shows you how to completely reset push notifications and start fresh, as if nothing has been configured yet.

## 🔄 **Complete Reset Process**

### **Step 1: Clear Push Subscriptions from Database**

1. **Go to Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Run This SQL to Clear All Push Subscriptions:**
   ```sql
   -- Delete all push subscriptions (complete reset)
   DELETE FROM push_subscriptions;
   
   -- Verify they're deleted
   SELECT * FROM push_subscriptions;
   ```

   **Or delete for a specific driver:**
   ```sql
   -- Replace 'driver-user-id' with actual driver ID
   DELETE FROM push_subscriptions 
   WHERE user_id = 'driver-user-id';
   ```

3. **Click "Run"** to execute the query

---

### **Step 2: Clear Browser Service Worker Subscription**

**In the Driver's Browser:**

1. **Open Browser DevTools:**
   - Press `F12` or right-click → **Inspect**
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

2. **Unregister Service Worker:**
   - Go to **Application** → **Service Workers** (or **Storage** → **Service Workers**)
   - Find the service worker for `my-runner.com`
   - Click **"Unregister"** button
   - Confirm if prompted

3. **Clear Service Worker Cache (Optional):**
   - In **Application** tab, go to **Cache Storage**
   - Delete all cache entries for `my-runner.com`
   - Go to **Application** → **Clear storage**
   - Check all boxes and click **"Clear site data"**

---

### **Step 3: Clear Browser Notification Permissions**

**Option A: Clear Site Permissions (Chrome/Edge)**

1. Click the **lock icon** or **info icon** in the address bar
2. Click **"Site settings"** or **"Permissions"**
3. Find **"Notifications"**
4. Change from **"Allow"** to **"Block"** (or **"Ask"**)
5. Refresh the page

**Option B: Clear All Site Data**

1. In **Application** tab → **Clear storage**
2. Check all boxes including:
   - Cookies
   - Cache
   - Service Workers
   - Local Storage
   - IndexedDB
3. Click **"Clear site data"**
4. Refresh the page

**Option C: Browser Settings (Manual)**

1. **Chrome/Edge:**
   - Go to: `chrome://settings/content/notifications`
   - Find `my-runner.com`
   - Click **"Remove"**

2. **Firefox:**
   - Go to: `about:preferences#privacy`
   - Scroll to **"Permissions"**
   - Click **"Settings"** next to **"Notifications"**
   - Find `my-runner.com` and click **"Remove Site"**

3. **Safari:**
   - Go to: Safari → Preferences → Websites → Notifications
   - Find `my-runner.com`
   - Click **"Remove"**

---

### **Step 4: Reset Driver Availability (Optional)**

If you want to reset the driver's online status too:

```sql
-- Reset driver availability (optional)
UPDATE driver_availability 
SET is_online = false, last_seen = NOW()
WHERE driver_id = 'driver-user-id';

-- Or reset all drivers
UPDATE driver_availability 
SET is_online = false, last_seen = NOW();
```

---

### **Step 5: Verify Everything is Reset**

**Check Database:**
```sql
-- Should return no rows (empty)
SELECT * FROM push_subscriptions WHERE user_id = 'driver-user-id';
```

**Check Browser Console:**
```javascript
// Run this in console - should return null
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub); // Should be null
  });
});

// Check notification permission - should be 'default' or 'denied'
console.log('Notification permission:', Notification.permission);
```

---

## ✅ **Fresh Setup Process**

After resetting, follow these steps:

### **Step 1: Driver Logs In**

1. Go to: https://my-runner.com
2. Driver logs in with their account
3. Go to **Driver Dashboard** (`/driver-dashboard`)

### **Step 2: Driver Enables Push Notifications**

1. **Look for the yellow banner** on the driver dashboard:
   - **"Enable instant driver alerts"**
   - Should appear if driver is logged in and push notifications are not enabled

2. **Click "Enable Push Alerts"** button

3. **Allow Notifications:**
   - Browser will prompt: **"my-runner.com wants to show notifications"**
   - Click **"Allow"** or **"Allow notifications"**

4. **Verify It's Enabled:**
   - The button should change to **"Disable"**
   - Console should show: **"Push notification sent to driver..."** (optional log)
   - Check Supabase: Should see new record in `push_subscriptions` table

### **Step 3: Verify Setup**

**In Browser Console:**
```javascript
// Check subscription
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    if (sub) {
      console.log('✅ Subscription active:', sub.endpoint);
    } else {
      console.log('❌ No subscription found');
    }
  });
});

// Check permission
console.log('Permission:', Notification.permission); // Should be 'granted'
```

**In Supabase:**
```sql
-- Check if subscription was created
SELECT * FROM push_subscriptions WHERE user_id = 'driver-user-id';
```

**Expected Result:**
- ✅ Record exists in `push_subscriptions` table
- ✅ `endpoint` is present
- ✅ `keys` are present
- ✅ `user_id` matches driver ID

---

## 🧪 **Test Push Notification**

After setup, test it works:

### **Test 1: Manual Test (Browser Console)**

```javascript
// Test notification
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Test Notification', {
    body: 'Push notifications are working!',
    icon: '/favicon.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    tag: 'test-notification'
  });
  console.log('✅ Test notification sent!');
});
```

### **Test 2: Create Test Order**

1. Create a test order (as customer)
2. If driver is logged in and online, they should receive a push notification
3. Check console for: **"✅ Push notification sent to driver [driver-id]"**

---

## 🔧 **Quick Reset Script (Browser Console)**

If you want to quickly reset everything in the browser:

```javascript
// Complete browser reset for push notifications
(async () => {
  // 1. Unsubscribe from push
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    console.log('✅ Unsubscribed from push');
  }
  
  // 2. Unregister service worker
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    await reg.unregister();
    console.log('✅ Service worker unregistered');
  }
  
  // 3. Clear all caches
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    await caches.delete(cacheName);
    console.log('✅ Cache deleted:', cacheName);
  }
  
  // 4. Clear local storage (optional)
  localStorage.clear();
  console.log('✅ Local storage cleared');
  
  console.log('🔄 Reset complete! Reload the page to start fresh.');
})();
```

**After running this script:**
1. Reload the page
2. Service worker will re-register
3. Driver can enable push notifications again

---

## 📝 **Complete Reset Checklist**

### **Database:**
- [ ] Clear `push_subscriptions` table (for driver or all)
- [ ] Verify table is empty (optional)

### **Browser:**
- [ ] Unregister service worker
- [ ] Clear service worker cache
- [ ] Clear notification permissions
- [ ] Clear site data (optional)
- [ ] Reload the page

### **Fresh Setup:**
- [ ] Driver logs in to driver dashboard
- [ ] Driver clicks "Enable Push Alerts"
- [ ] Driver allows notifications when prompted
- [ ] Verify subscription created in database
- [ ] Test push notification

---

## 🚨 **Troubleshooting**

### **"Enable Push Alerts" Button Not Showing**

**Possible causes:**
- Driver is not logged in
- Driver is not on driver dashboard
- Push notifications already enabled
- Browser doesn't support push notifications

**Solution:**
1. Verify driver is logged in
2. Go to `/driver-dashboard`
3. Check browser console for errors
4. Verify browser supports push notifications

### **"Permission denied" After Reset**

**Solution:**
1. Check browser notification settings
2. Manually allow notifications in browser settings
3. Reload the page
4. Try enabling again

### **Subscription Not Created**

**Solution:**
1. Check browser console for errors
2. Verify VAPID keys are set in Netlify
3. Check Supabase connection
4. Verify driver profile exists

---

## 🎯 **Summary**

**To reset completely:**

1. **Clear database:** Delete from `push_subscriptions` table
2. **Clear browser:** Unregister service worker, clear permissions
3. **Reload page:** Service worker re-registers
4. **Enable again:** Driver clicks "Enable Push Alerts"
5. **Allow notifications:** Click "Allow" when prompted
6. **Verify setup:** Check subscription in database
7. **Test:** Send test notification

**After reset, the driver should see the "Enable Push Alerts" button again and go through the full setup process from scratch.**

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

