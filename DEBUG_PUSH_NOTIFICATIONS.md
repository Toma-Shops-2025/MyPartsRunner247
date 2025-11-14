# Debug Push Notifications - Step-by-Step Checklist

Your console shows: **"✅ Found 0 online drivers via fallback check"**

This means **no drivers are marked as online** in the `driver_availability` table. Follow this checklist to fix it.

---

## 🔍 **Step 1: Check if Driver Exists**

### **In Supabase Dashboard:**

1. Go to **Table Editor** → **`profiles`** table
2. Find the driver account (by email or name)
3. Check:
   - ✅ **`user_type`** = `'driver'`
   - ✅ **`status`** = `'active'`
   - ✅ Driver has a valid `id` (UUID)

**If driver doesn't exist or isn't a driver:**
- Create a driver account or update `user_type` to `'driver'`

---

## 🔍 **Step 2: Check Driver Availability Table**

### **In Supabase Dashboard:**

1. Go to **Table Editor** → **`driver_availability`** table
2. Look for a record with the driver's `driver_id`
3. Check:
   - ✅ Record exists in `driver_availability` table
   - ✅ **`driver_id`** matches the driver's `id` from `profiles` table
   - ✅ **`is_online`** = `true` (or `TRUE`)
   - ✅ **`last_seen`** is recent (within last hour)

**If no record exists:**
- Driver needs to log in to the driver dashboard (this creates the record)

**If `is_online` = `false`:**
- Driver needs to log in to the driver dashboard (this sets `is_online = true`)

---

## 🔍 **Step 3: Check Driver Push Subscription**

### **In Supabase Dashboard:**

1. Go to **Table Editor** → **`push_subscriptions`** table
2. Look for a record with the driver's `user_id`
3. Check:
   - ✅ Record exists in `push_subscriptions` table
   - ✅ **`user_id`** matches the driver's `id` from `profiles` table
   - ✅ **`endpoint`** is present (not null/empty)
   - ✅ **`keys`** are present (not null/empty)

**If no record exists:**
- Driver needs to enable push notifications in the driver dashboard

---

## ✅ **Step 4: Verify Driver is Logged In**

### **Have the Driver:**

1. Go to: https://my-runner.com
2. Log in with their driver account
3. Go to **Driver Dashboard** (`/driver-dashboard`)
4. Wait a few seconds for the system to update their status
5. Check the header for an **"Online"** badge (green indicator)

**What should happen:**
- System automatically creates/updates `driver_availability` record
- Sets `is_online = true`
- Updates `last_seen` to current time

---

## ✅ **Step 5: Enable Push Notifications**

### **Have the Driver:**

1. On the Driver Dashboard, look for the yellow banner:
   - **"Enable instant driver alerts"**
2. Click **"Enable Push Alerts"** button
3. **Allow notifications** when the browser prompts you
4. Verify the button changes to **"Disable"** (means it's enabled)

**What should happen:**
- System creates a record in `push_subscriptions` table
- Stores the push subscription `endpoint` and `keys`
- Links it to the driver's `user_id`

---

## 🔍 **Step 6: Verify in Database**

### **Run This SQL Query in Supabase:**

```sql
-- Check if driver is properly set up
SELECT 
  p.id AS driver_id,
  p.email,
  p.full_name,
  p.user_type,
  p.status,
  da.is_online,
  da.last_seen,
  ps.user_id AS has_push_subscription,
  NOW() - da.last_seen AS time_since_last_seen
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
LEFT JOIN push_subscriptions ps ON p.id = ps.user_id
WHERE p.user_type = 'driver'
ORDER BY da.last_seen DESC NULLS LAST;
```

**What to look for:**
- ✅ Driver has `user_type = 'driver'`
- ✅ Driver has `status = 'active'`
- ✅ `driver_availability` record exists
- ✅ `is_online = true`
- ✅ `last_seen` is recent (within last hour)
- ✅ `push_subscriptions` record exists
- ✅ `endpoint` and `keys` are present

---

## 🔧 **Quick Fixes**

### **Fix 1: Manually Mark Driver as Online**

If driver is logged in but not showing as online:

```sql
-- Replace 'driver-user-id-here' with actual driver ID
INSERT INTO driver_availability (driver_id, is_online, last_seen)
VALUES ('driver-user-id-here', true, NOW())
ON CONFLICT (driver_id) 
DO UPDATE SET 
  is_online = true, 
  last_seen = NOW();
```

### **Fix 2: Check for Missing Driver ID Match**

Verify the driver's `id` matches the `driver_id` in `driver_availability`:

```sql
-- Find drivers with mismatched IDs
SELECT 
  p.id AS profile_id,
  p.email,
  da.driver_id AS availability_driver_id,
  da.is_online
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver'
  AND (da.driver_id IS NULL OR da.driver_id != p.id);
```

### **Fix 3: Check All Active Drivers**

```sql
-- List all active drivers
SELECT 
  p.id,
  p.email,
  p.full_name,
  da.is_online,
  da.last_seen
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver'
  AND p.status = 'active';
```

---

## 🧪 **Test After Fixes**

### **Step 1: Verify Driver is Online**

1. Check `driver_availability` table:
   - `is_online = true`
   - `last_seen` is recent

2. Check driver dashboard:
   - "Online" badge appears
   - No errors in browser console

### **Step 2: Verify Push Subscription**

1. Check `push_subscriptions` table:
   - Record exists for driver
   - `endpoint` and `keys` are present

2. Test push notification from console:
   ```javascript
   navigator.serviceWorker.ready.then(registration => {
     registration.showNotification('Test', {
       body: 'Push notifications are working!',
       icon: '/icon-192x192.png'
     });
   });
   ```

### **Step 3: Create Test Order**

1. Create a new test order
2. Check console for:
   - `✅ Found X online drivers via fallback check` (should be > 0)
   - `✅ Push notification sent to driver...`
3. Verify driver receives push notification

---

## 📊 **Expected Console Output**

### **If Everything Works:**

```
🤖 AUTOMATION: Processing new order [order-id]
📧 Attempting to notify customer of order creation...
✅ Customer notification sent
⚠️ No coordinates available, broadcasting to all online drivers
✅ Found 1 online drivers via fallback check  ← Should be > 0
📢 Creating in-app notifications for 1 drivers for order [order-id]
✅ Push notification sent to driver [driver-id]  ← Should appear
```

### **Current Output (Issue):**

```
🤖 AUTOMATION: Processing new order [order-id]
✅ Customer notification sent
⚠️ No coordinates available, broadcasting to all online drivers
⚠️ No drivers found with recent last_seen, trying fallback check...
✅ Found 0 online drivers via fallback check  ← PROBLEM: 0 drivers
⚠️ No online drivers available to notify  ← No drivers to notify
```

---

## 🎯 **Most Likely Issues**

### **Issue 1: Driver Not Logged In**
- **Solution:** Have driver log in to driver dashboard
- **Verify:** Check `driver_availability` table for record

### **Issue 2: Driver Not Marked as Online**
- **Solution:** Have driver log in to driver dashboard (auto-updates)
- **Verify:** Check `is_online = true` in `driver_availability`

### **Issue 3: No Push Subscription**
- **Solution:** Have driver click "Enable Push Alerts" button
- **Verify:** Check `push_subscriptions` table for record

### **Issue 4: Driver ID Mismatch**
- **Solution:** Verify `driver_id` in `driver_availability` matches `id` in `profiles`
- **Verify:** Run the SQL query to check for mismatches

---

## 🚨 **Emergency Fix**

If you need to quickly test push notifications:

1. **Manually mark driver as online:**
   ```sql
   INSERT INTO driver_availability (driver_id, is_online, last_seen)
   VALUES ('driver-user-id', true, NOW())
   ON CONFLICT (driver_id) 
   DO UPDATE SET is_online = true, last_seen = NOW();
   ```

2. **Test push notification manually:**
   - Use Netlify function: `/.netlify/functions/send-driver-push`
   - Send test notification directly

3. **Verify it works before creating another order**

---

## 📝 **Next Steps**

1. ✅ Check if driver exists in `profiles` table
2. ✅ Check if driver has record in `driver_availability` table
3. ✅ Check if `is_online = true`
4. ✅ Check if driver has push subscription
5. ✅ Have driver log in and enable push notifications
6. ✅ Test with another order
7. ✅ Check Netlify function logs for errors

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

