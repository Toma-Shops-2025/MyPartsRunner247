# Google Maps Integration Setup Guide

This guide explains how to configure Google Maps for navigation and tracking in MY-RUNNER.COM.

## 🗺️ Required Environment Variables

### 1. Google Maps JavaScript API Key
- **Key:** `VITE_GOOGLE_MAPS_API_KEY`
- **Value:** Your Google Maps JavaScript API key (starts with `AIza...`)

### 2. Google Distance Matrix API Key (for pricing)
- **Key:** `GOOGLE_MAPS_API_KEY` 
- **Value:** Your Google Distance Matrix API key (same key as above)

## 🚀 Setup Instructions

### 1. Enable Required APIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Library**
4. Enable these APIs:
   - **Maps JavaScript API** (for navigation and tracking)
   - **Distance Matrix API** (for pricing calculations)
   - **Geocoding API** (for address conversion)

### 2. Configure API Key Restrictions

1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**, choose:
   - **HTTP referrers (web sites)** for `VITE_GOOGLE_MAPS_API_KEY`
   - **None** for `GOOGLE_MAPS_API_KEY` (used by Netlify functions)

### 3. Add to Netlify Environment Variables

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Build & deploy** > **Environment variables**
3. Add these variables:
   - **Key:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** `AIza...` (your Google Maps key)
   - **Key:** `GOOGLE_MAPS_API_KEY` 
   - **Value:** `AIza...` (same key)

### 4. Redeploy Your Site

After adding the environment variables, trigger a new deploy on Netlify.

## 🎯 Features Enabled

### Driver Navigation
- **Real-time GPS navigation** with Google Maps
- **Turn-by-turn directions** with traffic data
- **Route optimization** for fastest delivery
- **Live location tracking** for customers

### Customer Tracking
- **Real-time driver location** on Google Maps
- **Order status updates** with visual indicators
- **ETA calculations** based on traffic
- **Interactive map** with pickup/delivery markers

## 🔧 Technical Details

### APIs Used
- **Maps JavaScript API:** Interactive maps and navigation
- **Distance Matrix API:** Accurate pricing calculations
- **Geocoding API:** Address to coordinate conversion

### Features
- **Traffic-aware routing** for accurate ETAs
- **Real-time location updates** every 3 seconds
- **Custom markers** for pickup/delivery locations
- **Responsive design** for mobile and desktop

## 🆓 Free Tier Limits

- **Maps JavaScript API:** 28,000 loads/month
- **Distance Matrix API:** 40,000 elements/month
- **Geocoding API:** 40,000 requests/month

These limits are more than sufficient for a growing delivery business.

## 🚨 Troubleshooting

### Common Issues

1. **"Google Maps API key not found"**
   - Check that `VITE_GOOGLE_MAPS_API_KEY` is set in Netlify
   - Verify the key starts with `AIza...`

2. **"This page can't load Google Maps correctly"**
   - Check API key restrictions in Google Cloud Console
   - Ensure your domain is added to referrer restrictions

3. **Navigation not working**
   - Verify Maps JavaScript API is enabled
   - Check browser console for errors

4. **Distance calculation failing**
   - Ensure Distance Matrix API is enabled
   - Check that `GOOGLE_MAPS_API_KEY` is set in Netlify

### Support
- Check Netlify function logs for backend errors
- Verify API quotas in Google Cloud Console
- Test with different addresses to isolate issues
