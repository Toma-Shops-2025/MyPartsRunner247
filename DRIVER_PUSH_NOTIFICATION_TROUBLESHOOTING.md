# Driver Push Notification Troubleshooting Guide

This guide helps you troubleshoot why drivers aren't receiving push notifications when orders are created.

## 🐛 **Problem: Driver Not Receiving Push Notifications**

### **Symptoms:**
- Order created successfully
- Console shows: "⚠️ No online drivers available to notify for order"
- Driver doesn't receive push notification
- Order is added to queue instead of being assigned

---

## 🔍 **Root Causes**

### **1. Driver Not Marked as Online**

The system only sends push notifications to drivers who are:
- Marked as `is_online = true` in the `driver_availability` table
- Have `last_seen` within the last 15 minutes
- Have `user_type = 'driver'` in the `profiles` table
- Have `status = 'active'` in the `profiles` table

### **2. Driver Hasn't Enabled Push Notifications**

The driver must:
- Be logged in to the driver dashboard
- Click "Enable Push Alerts" button
- Allow notifications when the browser prompts
- Have a push subscription stored in the `push_subscriptions` table

### **3. Driver Not Logged In**

The driver must be:
- Logged in to the driver dashboard
- Have an active session
- Be using the driver dashboard (not just browsing)

### **4. Push Subscription Not Stored**

The driver's push subscription must be:
- Stored in the `push_subscriptions` table in Supabase
- Linked to the driver's user ID
- Active and valid

---

## ✅ **Step-by-Step Troubleshooting**

### **Step 1: Check if Driver is Online**

1. **In Supabase:**
   - Go to your Supabase dashboard
   - Open the `driver_availability` table
   - Check if your driver has an entry with:
     - `is_online = true`
     - `last_seen` within the last 15 minutes
   - If not, the driver needs to log in to the driver dashboard

2. **In Browser Console (Driver's Browser):**
   ```javascript
   // Check if driver is online
   navigator.serviceWorker.ready.then(reg => {
     console.log('Service Worker ready:', !!reg);
     reg.pushManager.getSubscription().then(sub => {
       if (sub) {
         console.log('✅ Push subscription exists:', sub.endpoint);
       } else {
         console.log('❌ No push subscription');
       }
     });
   });
   ```

### **Step 2: Check if Driver Has Enabled Push Notifications**

1. **Have the driver:**
   - Log in to the driver dashboard
   - Look for the yellow banner: "Enable instant driver alerts"
   - Click "Enable Push Alerts"
   - Allow notifications when the browser prompts
   - Verify the button changes to "Disable" (means it's enabled)

2. **Check in Supabase:**
   - Go to `push_subscriptions` table
   - Check if there's an entry with the driver's `user_id`
   - Verify the `endpoint` and `keys` are present

### **Step 3: Check if Driver is Logged In**

1. **Have the driver:**
   - Log in to https://my-runner.com
   - Go to the driver dashboard (`/driver-dashboard`)
   - Verify they're logged in as a driver (not a customer)
   - Check that the dashboard loads correctly

2. **Check in Browser Console (Driver's Browser):**
   ```javascript
   // Check if user is logged in
   console.log('User logged in:', !!localStorage.getItem('supabase.auth.token'));
   ```

### **Step 4: Check Push Subscription**

1. **In Supabase:**
   - Go to `push_subscriptions` table
   - Find the driver's subscription
   - Verify:
     - `user_id` matches the driver's ID
     - `endpoint` is present
     - `keys` are present
     - `updated_at` is recent

2. **In Browser Console (Driver's Browser):**
   ```javascript
   // Check push subscription
   navigator.serviceWorker.ready.then(reg => {
     reg.pushManager.getSubscription().then(sub => {
       if (sub) {
         console.log('Subscription:', JSON.stringify(sub.toJSON(), null, 2));
       } else {
         console.log('No subscription found');
       }
     });
   });
   ```

### **Step 5: Check Netlify Function Logs**

1. **In Netlify:**
   - Go to your Netlify dashboard
   - Select your site
   - Go to **Functions** → **send-driver-push** → **Logs**
   - Check for errors when an order is created
   - Look for messages like:
     - "No active subscriptions"
     - "Failed to send push notification"
     - "Missing VAPID keys"

### **Step 6: Test Push Notification Manually**

1. **In Browser Console (Driver's Browser):**
   ```javascript
   // Test push notification
   navigator.serviceWorker.ready.then(registration => {
     registration.showNotification('Test Notification', {
       body: 'This is a test notification from MY-RUNNER.COM!',
       icon: '/icon-192x192.png',
       badge: '/icon-192x192.png',
       vibrate: [100, 50, 100],
       tag: 'test-notification'
     });
     console.log('✅ Test notification sent!');
   });
   ```

2. **If the test notification appears:**
   - Push notifications are working
   - The issue is with the notification sending logic

3. **If the test notification doesn't appear:**
   - Check browser notification settings
   - Verify notifications are allowed for my-runner.com
   - Check service worker is registered

---

## 🔧 **Common Fixes**

### **Fix 1: Make Driver Online**

1. **Have the driver:**
   - Log in to the driver dashboard
   - The system should automatically mark them as online
   - Check `driver_availability` table to verify

2. **Manually mark driver as online (if needed):**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO driver_availability (driver_id, is_online, last_seen)
   VALUES ('driver-user-id', true, NOW())
   ON CONFLICT (driver_id) 
   DO UPDATE SET is_online = true, last_seen = NOW();
   ```

### **Fix 2: Enable Push Notifications**

1. **Have the driver:**
   - Log in to the driver dashboard
   - Click "Enable Push Alerts"
   - Allow notifications when prompted
   - Verify the subscription is created

2. **Check in Supabase:**
   - Verify entry in `push_subscriptions` table
   - Check that `endpoint` and `keys` are present

### **Fix 3: Check VAPID Keys**

1. **In Netlify:**
   - Verify `VITE_VAPID_PUBLIC_KEY` is set
   - Verify `VAPID_PUBLIC_KEY` is set
   - Verify `VAPID_PRIVATE_KEY` is set
   - Redeploy after adding keys

2. **Test VAPID keys:**
   ```javascript
   // In browser console
   console.log('VAPID Public Key:', import.meta.env.VITE_VAPID_PUBLIC_KEY || 'Not set');
   ```

### **Fix 4: Check Service Worker**

1. **Verify service worker is registered:**
   ```javascript
   // In browser console
   navigator.serviceWorker.ready.then(reg => {
     console.log('Service Worker:', reg);
     console.log('Push Manager:', reg.pushManager);
   });
   ```

2. **Check service worker file:**
   - Verify `/sw.js` is accessible
   - Check that it has push notification handlers
   - Verify it's updated after deployment

---

## 📊 **Debugging Checklist**

Use this checklist to debug push notification issues:

- [ ] Driver is logged in to driver dashboard
- [ ] Driver is marked as online in `driver_availability` table
- [ ] Driver's `last_seen` is within last 15 minutes
- [ ] Driver has enabled push notifications
- [ ] Driver has push subscription in `push_subscriptions` table
- [ ] VAPID keys are set in Netlify environment variables
- [ ] Service worker is registered
- [ ] Browser notifications are allowed for my-runner.com
- [ ] Netlify function logs show no errors
- [ ] Test notification appears in browser

---

## 🚨 **Common Errors**

### **"No online drivers available to notify"**
- **Cause:** Driver is not marked as online
- **Fix:** Have driver log in to driver dashboard

### **"No active subscriptions"**
- **Cause:** Driver hasn't enabled push notifications
- **Fix:** Have driver click "Enable Push Alerts" button

### **"Missing VAPID keys"**
- **Cause:** VAPID keys not set in Netlify
- **Fix:** Add VAPID keys to Netlify environment variables

### **"Failed to send push notification"**
- **Cause:** Netlify function error or invalid subscription
- **Fix:** Check Netlify function logs for details

### **"Permission denied"**
- **Cause:** Browser notifications not allowed
- **Fix:** Have driver allow notifications in browser settings

---

## 🔍 **Testing Push Notifications**

### **Test 1: Manual Test**
1. Have driver log in to driver dashboard
2. Enable push notifications
3. Send test notification from console
4. Verify notification appears

### **Test 2: Order Test**
1. Have driver log in to driver dashboard
2. Enable push notifications
3. Create a test order
4. Verify driver receives push notification
5. Check Netlify function logs

### **Test 3: End-to-End Test**
1. Have driver log in to driver dashboard
2. Enable push notifications
3. Mark driver as online
4. Create a test order with real payment
5. Verify driver receives push notification
6. Verify driver can accept the order

---

## 📝 **Next Steps**

After fixing the issue:

1. **Test again:**
   - Create another test order
   - Verify driver receives push notification
   - Check Netlify function logs

2. **Monitor:**
   - Check driver availability regularly
   - Monitor push notification success rate
   - Check Netlify function logs for errors

3. **Document:**
   - Document any issues found
   - Update this guide if needed
   - Share solutions with team

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

