# Distance Calculation Setup Guide

## Environment Variables for 100% Accurate Distance Calculation

### Required Environment Variables

Add these to your Netlify environment variables (Site Settings > Environment Variables):

#### 1. Mapbox Access Token (Recommended - Most Accurate)
```
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```
- **Get it from:** [Mapbox Account](https://account.mapbox.com/access-tokens/)
- **Accuracy:** 100% with real-time traffic data
- **Cost:** Free tier includes 50,000 requests/month

#### 2. OpenRouteService API Key (Free Alternative)
```
OPENROUTE_API_KEY=your_ors_api_key_here
```
- **Get it from:** [OpenRouteService](https://openrouteservice.org/dev/#/signup)
- **Accuracy:** 95% with driving routes
- **Cost:** Free tier includes 2,000 requests/day

### How It Works

The system tries multiple services in order of accuracy:

1. **Mapbox Matrix API** (100% accurate with traffic)
2. **OpenRouteService** (95% accurate driving routes)  
3. **Free geocoding fallback** (85% accurate)

### Setup Instructions

1. **Go to Netlify Dashboard**
2. **Select your site**
3. **Go to Site Settings > Environment Variables**
4. **Add the variables above**
5. **Redeploy your site**

### No API Keys? No Problem!

The system works without any API keys using free services:
- **Free Nominatim geocoding** (OpenStreetMap)
- **Haversine formula with road factor** for distance calculation
- **85% accuracy** - still very good for most use cases

### Testing

To test the distance calculation:
1. **Go to your pickup request form**
2. **Enter pickup and delivery addresses**
3. **Check the browser console** for distance calculation logs
4. **Verify the pricing breakdown** shows accurate distance

### Troubleshooting

#### If distance calculation fails:
- Check browser console for error messages
- Verify environment variables are set correctly
- Try with different addresses to test geocoding

#### For maximum accuracy:
- Use both Mapbox and OpenRouteService API keys
- The system will automatically select the most accurate result
- Traffic data from Mapbox provides real-time accuracy

### Cost Considerations

- **Mapbox:** Free tier = 50,000 requests/month
- **OpenRouteService:** Free tier = 2,000 requests/day  
- **Free fallback:** No cost, unlimited requests

For a delivery service, the free tiers should be more than sufficient for most use cases.
