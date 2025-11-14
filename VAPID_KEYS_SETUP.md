# VAPID Keys Setup Guide for Push Notifications

This guide will help you generate and configure VAPID keys for push notifications in MY-RUNNER.COM.

## 🎯 What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are used to identify your application server when sending push notifications. They consist of:
- **Public Key**: Used by the browser to subscribe to push notifications
- **Private Key**: Used by your server to send push notifications (KEEP SECRET!)

## 📋 Step-by-Step Setup

### Step 1: Generate VAPID Keys

**Option 1: Using npx (Recommended - No installation needed)**

Run this command to generate your VAPID keys:

```bash
npx web-push generate-vapid-keys
```

This will output:
- **Public Key** - Use this for both frontend and backend
- **Private Key** - Use this for backend only (KEEP SECRET!)

**Option 2: Using the included script**

If you have dependencies installed:

```bash
node generate-vapid-keys.cjs
```

This will output formatted values ready to copy:
- `VITE_VAPID_PUBLIC_KEY` - For frontend
- `VAPID_PUBLIC_KEY` - For backend (can be same as frontend)
- `VAPID_PRIVATE_KEY` - For backend (KEEP SECRET!)

### Step 2: Add Keys to Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add each of these variables:

#### Frontend Variable:
- **Name:** `VITE_VAPID_PUBLIC_KEY`
- **Value:** (The public key from the script output)
- **Scope:** All scopes

#### Backend Variables:
- **Name:** `VAPID_PUBLIC_KEY`
- **Value:** (Same as VITE_VAPID_PUBLIC_KEY)
- **Scope:** All scopes

- **Name:** `VAPID_PRIVATE_KEY`
- **Value:** (The private key from the script output)
- **Scope:** All scopes

6. Click **Save**
7. **Redeploy your site** after adding variables

### Step 3: Verify Setup

1. Open your site in a browser
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Try to enable push notifications
5. Check for any errors related to VAPID keys

### Step 4: Test Push Notifications

1. Log in to your site
2. Go to the notification settings
3. Click "Enable Notifications"
4. Allow notifications in your browser
5. Send a test notification
6. Verify the notification appears

## 🔧 Troubleshooting

### Push Notifications Not Working?

1. **Check Environment Variables:**
   - ✅ Verify all three VAPID variables are set in Netlify
   - ✅ Verify they match the generated keys
   - ✅ Check that variables are set for the correct scope

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for errors like "Missing VITE_VAPID_PUBLIC_KEY"
   - Check for subscription errors

3. **Check Service Worker:**
   - Go to DevTools → Application → Service Workers
   - Verify service worker is registered
   - Check for errors in service worker

4. **Check Netlify Function Logs:**
   - Go to Netlify → Functions → send-driver-push
   - Check logs for errors
   - Verify VAPID keys are being used correctly

5. **Verify Browser Support:**
   - Push notifications require HTTPS (or localhost)
   - Check that your browser supports push notifications
   - Verify notifications are enabled in browser settings

### Common Errors

#### "Missing VITE_VAPID_PUBLIC_KEY"
- **Solution:** Add `VITE_VAPID_PUBLIC_KEY` to Netlify environment variables
- **Scope:** All scopes (needed for frontend)

#### "Missing VAPID keys for push notifications"
- **Solution:** Add `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to Netlify environment variables
- **Scope:** All scopes (needed for backend)

#### "Notification permission denied"
- **Solution:** User must allow notifications in browser settings
- **Location:** Browser settings → Site permissions → Notifications

#### "Service worker not registered"
- **Solution:** Check that `/sw.js` is accessible
- **Verify:** Go to `https://your-site.netlify.app/sw.js` in browser

## 🔒 Security Notes

- ⚠️ **Never commit VAPID keys to Git**
- ⚠️ **Never expose the private key in frontend code**
- ⚠️ **Keep the private key secret - only in Netlify environment variables**
- ⚠️ **Use different keys for development and production if needed**

## 📝 Notes

- VAPID keys are unique to your application
- The same keys can be used for all users
- Keys don't expire - you can use them indefinitely
- If you need to rotate keys, generate new ones and update Netlify

## 🔗 Additional Resources

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

