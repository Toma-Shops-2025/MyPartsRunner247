# How to Find Your Google Maps API Key

This guide shows you exactly where to find or create your Google Maps API key.

## 🔗 **Quick Links**

- **Google Cloud Console:** https://console.cloud.google.com/
- **Credentials Page:** https://console.cloud.google.com/apis/credentials
- **API Library:** https://console.cloud.google.com/apis/library
- **Billing Setup:** https://console.cloud.google.com/billing

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Go to Google Cloud Console**

1. Open your browser
2. Go to: **https://console.cloud.google.com/**
3. Sign in with your Google account

### **Step 2: Select or Create a Project**

1. At the top of the page, click the **project dropdown** (next to "Google Cloud")
2. If you have an existing project:
   - Click on it to select it
3. If you don't have a project:
   - Click **"New Project"**
   - Enter a project name (e.g., "MY-RUNNER")
   - Click **"Create"**

### **Step 3: Enable Required APIs**

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for and enable these APIs:
   - **"Maps JavaScript API"** - Click it → Click **"Enable"**
   - **"Distance Matrix API"** - Click it → Click **"Enable"**
   - **"Geocoding API"** - Click it → Click **"Enable"** (optional but recommended)

### **Step 4: Create or Find API Key**

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. You'll see a list of API keys:
   - If you see an existing key, click on it to view/edit
   - If you don't have a key, click **"Create Credentials"** → **"API Key"**
3. A popup will appear with your API key (starts with `AIza...`)
4. **Copy the key** - You'll need this for Netlify

### **Step 5: Configure API Key Restrictions (Recommended)**

1. Click on your API key to edit it
2. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Click **"Add an item"**
   - Add your domains:
     - `https://my-runner.com/*`
     - `https://*.my-runner.com/*`
     - `http://localhost:*` (for local development)
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Select these APIs:
     - Maps JavaScript API
     - Distance Matrix API
     - Geocoding API
4. Click **"Save"**

### **Step 6: Set Up Billing (Required)**

1. Go to **"Billing"** in the left sidebar
2. Click **"Link a billing account"**
3. Add a payment method (Google provides free credits)
4. **Note:** Google Maps has a free tier:
   - $200 free credit per month
   - This covers most small to medium businesses

---

## 🔑 **What Your API Key Looks Like**

Your Google Maps API key will look like this:
```
AIzaSyBvOkBvXv2aBxYxYxYxYxYxYxYxYxYxYxYxYxYxYxY
```

It starts with `AIza` and is about 39 characters long.

---

## 📝 **Add to Netlify**

Once you have your API key:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add these two variables (use the same key for both):

   **Variable 1:**
   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** `AIza...` (your API key)
   - **Scope:** All scopes

   **Variable 2:**
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** `AIza...` (same API key)
   - **Scope:** All scopes

5. Click **"Save"**
6. **Redeploy your site**

---

## 🆓 **Free Tier Limits**

Google Maps provides a generous free tier:
- **$200 free credit per month**
- **28,000 map loads/month** (Maps JavaScript API)
- **40,000 distance calculations/month** (Distance Matrix API)
- **40,000 address lookups/month** (Geocoding API)

This is more than enough for most businesses!

---

## 🚨 **Troubleshooting**

### **"I can't find my API key"**
- Make sure you're signed in to the correct Google account
- Check that you've selected the correct project
- Try creating a new API key if you can't find the old one

### **"API key not working"**
- Verify the API key is correct (starts with `AIza`)
- Check that the required APIs are enabled
- Verify API key restrictions allow your domain
- Check that billing is set up

### **"Maps not loading"**
- Check browser console for errors
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set in Netlify
- Check that your domain is in the API key restrictions
- Verify the API key has the correct APIs enabled

### **"Billing required"**
- Google requires billing to be set up (even for free tier)
- You get $200 free credit per month
- You won't be charged unless you exceed the free tier

---

## 🔒 **Security Best Practices**

1. **Restrict API Key:**
   - Always set HTTP referrer restrictions
   - Only allow your domains
   - Restrict to specific APIs

2. **Monitor Usage:**
   - Check your API usage regularly
   - Set up billing alerts
   - Monitor quotas in Google Cloud Console

3. **Rotate Keys:**
   - Rotate API keys periodically
   - Revoke old keys when creating new ones
   - Update keys in Netlify immediately

---

## 📊 **Check API Usage**

1. Go to **"APIs & Services"** → **"Dashboard"**
2. You'll see:
   - API usage statistics
   - Quota limits
   - Billing information

---

## ✅ **Verification Checklist**

After setting up your API key:

- [ ] API key created in Google Cloud Console
- [ ] Required APIs enabled (Maps JavaScript API, Distance Matrix API, Geocoding API)
- [ ] API key restrictions configured
- [ ] Billing account linked
- [ ] API key added to Netlify (`VITE_GOOGLE_MAPS_API_KEY` and `GOOGLE_MAPS_API_KEY`)
- [ ] Site redeployed
- [ ] Maps loading on your site
- [ ] Address autocomplete working
- [ ] Distance calculations working

---

## 🎯 **Quick Reference**

**API Key Location:**
- Google Cloud Console → APIs & Services → Credentials

**Required APIs:**
- Maps JavaScript API
- Distance Matrix API
- Geocoding API

**Netlify Variables:**
- `VITE_GOOGLE_MAPS_API_KEY` (frontend)
- `GOOGLE_MAPS_API_KEY` (backend)

**Free Tier:**
- $200 free credit per month
- 28,000 map loads/month
- 40,000 distance calculations/month

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM

