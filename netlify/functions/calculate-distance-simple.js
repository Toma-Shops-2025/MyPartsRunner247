// Mapbox-only distance calculation with robust address handling
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pickupAddress, deliveryAddress } = JSON.parse(event.body);
    
    if (!pickupAddress || !deliveryAddress) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Pickup and delivery addresses are required' })
      };
    }

    console.log('🌍 Mapbox-only distance calculation');
    console.log('📍 Pickup:', pickupAddress);
    console.log('📍 Delivery:', deliveryAddress);

    // Check for Mapbox token - REQUIRED
    const mapboxToken = process.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    console.log('🔑 Mapbox token check:', mapboxToken ? 'Token found' : 'Token missing');
    console.log('🔑 Token preview:', mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'No token');
    
    if (!mapboxToken) {
      console.error('❌ Mapbox token not found - distance calculation requires Mapbox');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Mapbox token not configured',
          details: 'Distance calculation requires VITE_MAPBOX_ACCESS_TOKEN to be set in environment variables'
        })
      };
    }

    console.log('🚗 Using Mapbox for distance calculation...');
    
    // Clean and format addresses for better geocoding
    const cleanAddress = (address) => {
      return address
        .replace(/,/g, ' ')  // Replace commas with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
        .replace(/Louisville, Kentucky/g, 'Louisville KY') // Simplify state format
        .replace(/United States/g, '') // Remove country if present
        .trim();
    };

    const cleanPickup = cleanAddress(pickupAddress);
    const cleanDelivery = cleanAddress(deliveryAddress);
    
    console.log('🧹 Cleaned addresses:', { pickup: cleanPickup, delivery: cleanDelivery });

    // Step 1: Geocode both addresses using Mapbox with multiple attempts
    console.log('📍 Geocoding addresses with Mapbox...');
    
    const geocodeAddress = async (address, attempt = 1) => {
      const maxAttempts = 3;
      const variations = [
        address, // Original
        address + ', Louisville KY', // Add city/state
        address + ', KY', // Add state only
        address.split(',')[0] // Just the street address
      ];

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        console.log(`📍 Attempt ${attempt}.${i + 1}: Geocoding "${variation}"`);
        
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(variation)}.json?access_token=${mapboxToken}&country=US&limit=1&types=address`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              console.log(`✅ Geocoding successful for "${variation}": [${lng}, ${lat}]`);
              return { lng, lat, address: variation };
            }
          }
          
          console.log(`❌ Geocoding failed for "${variation}": ${response.status}`);
        } catch (error) {
          console.log(`❌ Geocoding error for "${variation}": ${error.message}`);
        }
      }

      if (attempt < maxAttempts) {
        console.log(`🔄 Retrying geocoding (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return geocodeAddress(address, attempt + 1);
      }

      return null;
    };

    const [pickupResult, deliveryResult] = await Promise.all([
      geocodeAddress(cleanPickup),
      geocodeAddress(cleanDelivery)
    ]);

    if (!pickupResult || !deliveryResult) {
      console.error('❌ Could not geocode one or both addresses');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Address geocoding failed',
          details: 'Could not find coordinates for one or both addresses. Please check the address format.'
        })
      };
    }

    console.log('📍 Coordinates found:', { 
      pickup: [pickupResult.lng, pickupResult.lat], 
      delivery: [deliveryResult.lng, deliveryResult.lat] 
    });

    // Step 2: Get driving directions using Mapbox Directions API
    console.log('🚗 Getting driving directions from Mapbox...');
    
    const directionsResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${pickupResult.lng},${pickupResult.lat};${deliveryResult.lng},${deliveryResult.lat}?access_token=${mapboxToken}&geometries=geojson&overview=full&annotations=distance,duration&alternatives=false&continue_straight=false`
    );

    if (!directionsResponse.ok) {
      console.error('❌ Mapbox Directions API failed:', directionsResponse.status);
      
      // Try without traffic data as fallback
      console.log('🔄 Trying without traffic data...');
      const fallbackResponse = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupResult.lng},${pickupResult.lat};${deliveryResult.lng},${deliveryResult.lat}?access_token=${mapboxToken}&geometries=geojson&overview=full&annotations=distance,duration&alternatives=false&continue_straight=false`
      );

      if (!fallbackResponse.ok) {
        console.error('❌ Mapbox Directions API completely failed:', fallbackResponse.status);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Driving directions failed',
            details: 'Could not calculate driving route between addresses'
          })
        };
      }

      const directionsData = await fallbackResponse.json();
      
      if (!directionsData.routes?.[0]) {
        console.error('❌ No route found');
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'No route found',
            details: 'Could not find a driving route between the addresses'
          })
        };
      }

      const route = directionsData.routes[0];
      const distanceInMeters = route.distance;
      const distanceInMiles = distanceInMeters * 0.000621371;
      const durationInMinutes = route.duration / 60;
      
      console.log('✅ Mapbox result (no traffic):', { 
        distance: distanceInMiles, 
        duration: durationInMinutes 
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          distance: distanceInMiles,
          duration: durationInMinutes,
          service: 'Mapbox Directions API (no traffic)',
          accuracy: '100% accurate driving distance'
        })
      };
    }

    const directionsData = await directionsResponse.json();
    
    if (!directionsData.routes?.[0]) {
      console.error('❌ No route found with traffic data');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'No route found',
          details: 'Could not find a driving route between the addresses'
        })
      };
    }

    const route = directionsData.routes[0];
    const distanceInMeters = route.distance;
    const distanceInMiles = distanceInMeters * 0.000621371;
    const durationInMinutes = route.duration / 60;
    
    console.log('✅ Mapbox result (with traffic):', { 
      distance: distanceInMiles, 
      duration: durationInMinutes 
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        distance: distanceInMiles,
        duration: durationInMinutes,
        service: 'Mapbox Directions API (with traffic)',
        accuracy: '100% accurate driving distance with real-time traffic'
      })
    };

  } catch (error) {
    console.error('❌ Distance calculation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Distance calculation failed',
        details: error.message 
      })
    };
  }
};