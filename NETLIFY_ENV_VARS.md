# Netlify Environment Variables Checklist

This document lists ALL environment variables required for MY-RUNNER.COM on Netlify.

## 🔴 **CRITICAL - Required for Core Functionality**

### Supabase Configuration
```
VITE_SUPABASE_URL
```
- **Used by:** Frontend (src/lib/supabase.ts) and ALL Netlify functions
- **Description:** Your Supabase project URL
- **Example:** `https://vzynutgjvlwccpubbkwg.supabase.co`
- **Location:** Netlify UI → Site settings → Environment variables

```
VITE_SUPABASE_ANON_KEY
```
- **Used by:** Frontend (src/lib/supabase.ts)
- **Description:** Supabase anonymous/public key for client-side operations
- **Location:** Netlify UI → Site settings → Environment variables

```
SUPABASE_SERVICE_ROLE_KEY
```
- **Used by:** ALL Netlify functions (backend operations)
- **Description:** Supabase service role key (has admin privileges - keep secret!)
- **⚠️ WARNING:** Never expose this in frontend code - only in Netlify functions
- **Location:** Netlify UI → Site settings → Environment variables

---

## 🟠 **HIGH PRIORITY - Required for Key Features**

### Push Notifications (VAPID Keys)
```
VITE_VAPID_PUBLIC_KEY
```
- **Used by:** Frontend (src/services/pushNotificationService.ts)
- **Description:** Public VAPID key for push notification subscription
- **How to get:** Generate using `web-push generate-vapid-keys` or online tool
- **Location:** Netlify UI → Site settings → Environment variables

```
VAPID_PUBLIC_KEY
```
- **Used by:** Netlify function (netlify/functions/send-driver-push.js)
- **Description:** Same as VITE_VAPID_PUBLIC_KEY but for backend
- **Note:** Can be the same value as VITE_VAPID_PUBLIC_KEY
- **Location:** Netlify UI → Site settings → Environment variables

```
VAPID_PRIVATE_KEY
```
- **Used by:** Netlify function (netlify/functions/send-driver-push.js)
- **Description:** Private VAPID key for sending push notifications
- **⚠️ WARNING:** Keep this secret - never expose in frontend
- **Location:** Netlify UI → Site settings → Environment variables

### Stripe Payment Processing
```
VITE_STRIPE_PUBLISHABLE_KEY
```
- **Used by:** Frontend (src/lib/stripe.ts, src/components/StripePaymentForm.tsx)
- **Description:** Stripe publishable key (starts with `pk_`)
- **Example:** `pk_live_...` (production) or `pk_test_...` (development)
- **Location:** Netlify UI → Site settings → Environment variables

```
STRIPE_SECRET_KEY
```
- **Used by:** ALL Stripe Netlify functions
  - netlify/functions/create-payment-intent.js
  - netlify/functions/process-order-completion.js
  - netlify/functions/create-driver-account.js
  - netlify/functions/check-driver-capabilities.js
  - netlify/functions/enable-instant-payouts.js
  - netlify/functions/pay-driver.js
  - netlify/functions/pay-driver-flexible.js
- **Description:** Stripe secret key (starts with `sk_`)
- **⚠️ WARNING:** Keep this secret - never expose in frontend
- **Location:** Netlify UI → Site settings → Environment variables

### Google Maps API
```
VITE_GOOGLE_MAPS_API_KEY
```
- **Used by:** Frontend
  - src/utils/googleMapsLoader.ts
  - src/hooks/useLocation.ts
  - src/components/AddressAutocomplete.tsx
  - src/components/AddressDebugInfo.tsx
- **Description:** Google Maps API key for frontend maps/geocoding
- **Location:** Netlify UI → Site settings → Environment variables

```
GOOGLE_MAPS_API_KEY
```
- **Used by:** Netlify function (netlify/functions/calculate-distance-google.js)
- **Description:** Google Maps API key for backend distance calculations
- **Note:** Can be the same value as VITE_GOOGLE_MAPS_API_KEY
- **Location:** Netlify UI → Site settings → Environment variables

---

## 🟡 **MEDIUM PRIORITY - Optional but Recommended**

### Email Service (SendGrid)
```
SENDGRID_API_KEY
```
- **Used by:** Netlify function (netlify/functions/send-delivery-email.js)
- **Description:** SendGrid API key for sending delivery confirmation emails
- **Location:** Netlify UI → Site settings → Environment variables

### Application URL
```
VITE_APP_URL
```
- **Used by:** 
  - Frontend services (src/services/RealTimeOrderService.ts, etc.)
  - Netlify function (netlify/functions/create-driver-account.js)
- **Description:** Your application's base URL
- **Example:** `https://my-runner.com` or `https://your-site.netlify.app`
- **Location:** Netlify UI → Site settings → Environment variables

### Mapbox (Alternative to Google Maps)
```
VITE_MAPBOX_ACCESS_TOKEN
```
- **Used by:** Frontend (src/components/AddressAutocomplete.tsx, src/components/AddressDebugInfo.tsx)
- **Description:** Mapbox access token (if using Mapbox for maps)
- **Note:** Optional if using Google Maps
- **Location:** Netlify UI → Site settings → Environment variables

---

## 🟢 **LOW PRIORITY - Optional/Advanced**

### Cron Job Security
```
CRON_SECRET_TOKEN
```
- **Used by:** Netlify function (netlify/functions/document-expiration-cron.js)
- **Description:** Secret token for securing cron job endpoints
- **Note:** Only needed if using automated cron jobs
- **Location:** Netlify UI → Site settings → Environment variables

---

## 📋 **QUICK SETUP CHECKLIST**

Copy and paste this into Netlify's environment variables section:

### Required Variables (Copy these names exactly):
1. ✅ `VITE_SUPABASE_URL`
2. ✅ `VITE_SUPABASE_ANON_KEY`
3. ✅ `SUPABASE_SERVICE_ROLE_KEY`
4. ✅ `VITE_VAPID_PUBLIC_KEY`
5. ✅ `VAPID_PUBLIC_KEY`
6. ✅ `VAPID_PRIVATE_KEY`
7. ✅ `VITE_STRIPE_PUBLISHABLE_KEY`
8. ✅ `STRIPE_SECRET_KEY`
9. ✅ `VITE_GOOGLE_MAPS_API_KEY`
10. ✅ `GOOGLE_MAPS_API_KEY`
11. ✅ `VITE_APP_URL`
12. ✅ `SENDGRID_API_KEY` (if using email notifications)
13. ✅ `VITE_MAPBOX_ACCESS_TOKEN` (if using Mapbox)
14. ✅ `CRON_SECRET_TOKEN` (if using cron jobs)

---

## 🔧 **HOW TO SET UP IN NETLIFY**

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add each variable name and value
6. For **production**, set the scope to **Production**
7. For **preview/deploy**, set the scope to **All scopes**
8. Click **Save**
9. **Redeploy your site** after adding variables

---

## 🚨 **TROUBLESHOOTING**

### Push Notifications Not Working?
- ✅ Check that `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` are all set
- ✅ Verify VAPID keys are valid (generate new ones if needed)
- ✅ Check browser console for errors
- ✅ Verify service worker is registered

### Payments Not Working?
- ✅ Check that `VITE_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are set
- ✅ Verify Stripe keys match (both test or both live)
- ✅ Check Netlify function logs for errors

### Maps Not Loading?
- ✅ Check that `VITE_GOOGLE_MAPS_API_KEY` is set
- ✅ Verify Google Maps API is enabled in Google Cloud Console
- ✅ Check browser console for API key errors

### Database Errors?
- ✅ Check that `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set
- ✅ Verify Supabase project is active
- ✅ Check Netlify function logs for authentication errors

---

## 📝 **NOTES**

- Variables starting with `VITE_` are exposed to the frontend (public)
- Variables without `VITE_` prefix are only available in Netlify functions (private)
- Never commit `.env` files to Git - use Netlify's environment variables instead
- After adding/changing environment variables, you must **redeploy** your site
- Some variables can use the same value (e.g., `VAPID_PUBLIC_KEY` and `VITE_VAPID_PUBLIC_KEY`)

---

## 🔗 **WHERE TO GET THESE VALUES**

- **Supabase:** Dashboard → Project Settings → API
- **Stripe:** Dashboard → Developers → API keys
- **Google Maps:** Google Cloud Console → APIs & Services → Credentials
- **SendGrid:** Dashboard → Settings → API Keys
- **VAPID Keys:** Generate using `web-push generate-vapid-keys` command or online tool
- **Mapbox:** Dashboard → Account → Access tokens

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

