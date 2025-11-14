# How to Verify if a Driver is Marked as Online

This guide shows you multiple ways to check if a driver is marked as online in MY-RUNNER.COM.

## 🔍 **Method 1: Check in Supabase Dashboard (Recommended)**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project

### **Step 2: Check `driver_availability` Table**
1. In the left sidebar, click **"Table Editor"**
2. Select the **`driver_availability`** table
3. Find the driver you want to check (by `driver_id`)
4. Check these fields:
   - **`is_online`** - Should be `true` if driver is online
   - **`last_seen`** - Should be recent (within the last hour)
   - **`driver_id`** - The driver's user ID

### **Example:**
```
driver_id: abc123...
is_online: true
last_seen: 2025-01-13T15:30:00Z
```

### **Step 3: Check `profiles` Table**
1. In the left sidebar, click **"Table Editor"**
2. Select the **`profiles`** table
3. Find the driver (by email or name)
4. Check these fields:
   - **`user_type`** - Should be `'driver'`
   - **`status`** - Should be `'active'`
   - **`is_online`** - May also be here (check both tables)

---

## 🔍 **Method 2: Check Using SQL Query (Supabase)**

### **Step 1: Open SQL Editor**
1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

### **Step 2: Run This Query**

**Query 1: Check all online drivers**
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.user_type,
  p.status,
  da.is_online,
  da.last_seen,
  NOW() - da.last_seen AS time_since_last_seen
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver'
  AND p.status = 'active'
  AND da.is_online = true
ORDER BY da.last_seen DESC;
```

**Query 2: Check specific driver (replace 'driver-email@example.com' with actual email)**
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  da.is_online,
  da.last_seen,
  NOW() - da.last_seen AS time_since_last_seen
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.email = 'driver-email@example.com';
```

**Query 3: Check all drivers (online and offline)**
```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  da.is_online,
  da.last_seen,
  CASE 
    WHEN da.last_seen > NOW() - INTERVAL '1 hour' THEN 'Recent'
    WHEN da.last_seen > NOW() - INTERVAL '24 hours' THEN 'Last 24h'
    ELSE 'Old'
  END AS activity_status
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver'
ORDER BY da.last_seen DESC NULLS LAST;
```

**Query 4: Update driver as online (if needed)**
```sql
-- Replace 'driver-user-id' with actual driver ID
INSERT INTO driver_availability (driver_id, is_online, last_seen)
VALUES ('driver-user-id', true, NOW())
ON CONFLICT (driver_id) 
DO UPDATE SET 
  is_online = true, 
  last_seen = NOW();
```

---

## 🔍 **Method 3: Check in Browser Console (Driver's Browser)**

### **Step 1: Have Driver Open Dashboard**
1. Driver should log in to: https://my-runner.com
2. Go to Driver Dashboard (`/driver-dashboard`)
3. Open browser DevTools (F12)
4. Go to **Console** tab

### **Step 2: Run This JavaScript**

**Check if driver is online:**
```javascript
// Check if driver is marked as online
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ Driver not logged in');
    return;
  }
  
  console.log('Driver ID:', user.id);
  
  const { data: availability, error } = await supabase
    .from('driver_availability')
    .select('*')
    .eq('driver_id', user.id)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Driver Availability:', availability);
  console.log('Is Online:', availability?.is_online);
  console.log('Last Seen:', availability?.last_seen);
  
  const timeSinceLastSeen = new Date() - new Date(availability?.last_seen);
  const minutesAgo = Math.floor(timeSinceLastSeen / 60000);
  console.log(`Last seen: ${minutesAgo} minutes ago`);
  
  if (availability?.is_online) {
    console.log('✅ Driver is marked as ONLINE');
  } else {
    console.log('❌ Driver is marked as OFFLINE');
  }
})();
```

**Note:** The above code assumes `supabase` is available in the console. If not, use this version:

```javascript
// Simplified check (if supabase is not available in console)
fetch('/api/check-driver-status').then(r => r.json()).then(data => {
  console.log('Driver Status:', data);
});
```

---

## 🔍 **Method 4: Check in Driver Dashboard UI**

### **Step 1: Log in as Driver**
1. Go to: https://my-runner.com
2. Log in as the driver
3. Go to Driver Dashboard (`/driver-dashboard`)

### **Step 2: Look for Online Status Badge**
1. Check the header/navbar for an online/offline badge
2. Should show:
   - **"Online"** with green indicator (if online)
   - **"Offline"** with gray indicator (if offline)

### **Step 3: Check Browser Console**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for logs like:
   - `"Driver marked as online and active"`
   - `"Driver marked as offline and inactive"`
   - `"Error updating driver_availability"`

---

## 🔍 **Method 5: Check Using Netlify Functions**

You can create a simple Netlify function to check driver status:

### **Function Code:**
```javascript
// netlify/functions/check-driver-status.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const { driverId } = JSON.parse(event.body || '{}');
  
  if (!driverId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'driverId required' })
    };
  }
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data, error } = await supabase
    .from('driver_availability')
    .select('*')
    .eq('driver_id', driverId)
    .single();
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driver: data, error })
  };
};
```

### **Test It:**
```bash
curl -X POST https://my-runner.com/.netlify/functions/check-driver-status \
  -H "Content-Type: application/json" \
  -d '{"driverId": "driver-user-id"}'
```

---

## ✅ **What to Look For**

### **Driver is Online If:**
- ✅ `is_online = true` in `driver_availability` table
- ✅ `last_seen` is recent (within last hour, ideally within last 15 minutes)
- ✅ `user_type = 'driver'` in `profiles` table
- ✅ `status = 'active'` in `profiles` table
- ✅ Online badge appears in driver dashboard UI

### **Driver is Offline If:**
- ❌ `is_online = false` in `driver_availability` table
- ❌ `last_seen` is very old (more than 1 hour ago)
- ❌ No entry in `driver_availability` table
- ❌ Offline badge appears in driver dashboard UI

---

## 🔧 **Troubleshooting**

### **Driver Shows as Offline But Should Be Online**

1. **Check if driver is logged in:**
   - Have driver check if they're logged in
   - Have driver refresh the dashboard
   - Check browser console for errors

2. **Manually mark driver as online (if needed):**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO driver_availability (driver_id, is_online, last_seen)
   VALUES ('driver-user-id', true, NOW())
   ON CONFLICT (driver_id) 
   DO UPDATE SET is_online = true, last_seen = NOW();
   ```

3. **Check if `last_seen` is updating:**
   - Driver dashboard should update `last_seen` every 2 minutes
   - Check browser console for errors
   - Check Network tab for failed requests

4. **Check driver profile:**
   - Verify `user_type = 'driver'` in `profiles` table
   - Verify `status = 'active'` in `profiles` table

### **Driver Shows as Online But Not Receiving Notifications**

1. **Check push notifications:**
   - Verify driver has enabled push notifications
   - Check `push_subscriptions` table for entry
   - Test push notification manually

2. **Check order creation:**
   - Verify order was created successfully
   - Check Netlify function logs for errors
   - Verify VAPID keys are set correctly

3. **Check notification settings:**
   - Verify browser notifications are allowed
   - Check service worker is registered
   - Test notification from console

---

## 📊 **Quick Reference**

### **Supabase Tables:**
- **`driver_availability`** - Tracks online status and last seen
- **`profiles`** - Driver profile information
- **`push_subscriptions`** - Push notification subscriptions

### **Key Fields:**
- **`is_online`** - Boolean, true if driver is online
- **`last_seen`** - Timestamp of last activity
- **`driver_id`** - References `profiles.id`
- **`user_type`** - Should be `'driver'`
- **`status`** - Should be `'active'`

### **SQL Queries:**
- List all online drivers
- Check specific driver status
- Update driver as online/offline
- Check recent activity

---

## 🎯 **Best Practices**

1. **Regular Checks:**
   - Check driver status before creating orders
   - Monitor online driver count
   - Check `last_seen` timestamps regularly

2. **Monitoring:**
   - Set up alerts for low online driver count
   - Monitor `last_seen` for stale records
   - Check for drivers stuck in online state

3. **Debugging:**
   - Use SQL queries to investigate issues
   - Check browser console for errors
   - Verify data in Supabase dashboard

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

