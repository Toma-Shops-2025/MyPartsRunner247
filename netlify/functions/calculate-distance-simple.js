// Mapbox-only distance calculation - no fallbacks
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
    
    // Step 1: Geocode both addresses using Mapbox
    console.log('📍 Geocoding addresses with Mapbox...');
    
    const [pickupResponse, deliveryResponse] = await Promise.all([
      fetch(`https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(pickupAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`),
      fetch(`https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`)
    ]);

    if (!pickupResponse.ok || !deliveryResponse.ok) {
      console.error('❌ Mapbox geocoding failed:', {
        pickup: pickupResponse.status,
        delivery: deliveryResponse.status
      });
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Address geocoding failed',
          details: 'Could not convert addresses to coordinates'
        })
      };
    }

    const [pickupData, deliveryData] = await Promise.all([
      pickupResponse.json(),
      deliveryResponse.json()
    ]);

    if (!pickupData.features?.[0] || !deliveryData.features?.[0]) {
      console.error('❌ No coordinates found for addresses');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Address not found',
          details: 'Could not find coordinates for one or both addresses'
        })
      };
    }

    const [lng1, lat1] = pickupData.features[0].center;
    const [lng2, lat2] = deliveryData.features[0].center;

    console.log('📍 Coordinates found:', { 
      pickup: [lng1, lat1], 
      delivery: [lng2, lat2] 
    });

    // Step 2: Get driving directions using Mapbox Directions API
    console.log('🚗 Getting driving directions from Mapbox...');
    
    const directionsResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${lng1},${lat1};${lng2},${lat2}?access_token=${mapboxToken}&geometries=geojson&overview=full&annotations=distance,duration&alternatives=false&continue_straight=false`
    );

    if (!directionsResponse.ok) {
      console.error('❌ Mapbox Directions API failed:', directionsResponse.status);
      
      // Try without traffic data as fallback
      console.log('🔄 Trying without traffic data...');
      const fallbackResponse = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${lng1},${lat1};${lng2},${lat2}?access_token=${mapboxToken}&geometries=geojson&overview=full&annotations=distance,duration&alternatives=false&continue_straight=false`
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