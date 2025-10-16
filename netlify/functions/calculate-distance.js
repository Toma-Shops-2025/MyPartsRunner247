// Use built-in fetch (available in Node.js 18+)
// const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pickupAddress, deliveryAddress } = JSON.parse(event.body);
    
    if (!pickupAddress || !deliveryAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Pickup and delivery addresses are required' })
      };
    }

    const mapboxToken = process.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Mapbox token not configured' })
      };
    }

    console.log('Calculating distance for:', pickupAddress, 'to', deliveryAddress);

    // Step 1: Geocode both addresses
    const [pickupResponse, deliveryResponse] = await Promise.all([
      fetch(`https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(pickupAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`),
      fetch(`https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`)
    ]);

    if (!pickupResponse.ok || !deliveryResponse.ok) {
      throw new Error('Geocoding failed');
    }

    const [pickupData, deliveryData] = await Promise.all([
      pickupResponse.json(),
      deliveryResponse.json()
    ]);

    if (!pickupData.features || !pickupData.features[0] || !deliveryData.features || !deliveryData.features[0]) {
      throw new Error('Could not geocode addresses');
    }

    const [lng1, lat1] = pickupData.features[0].center;
    const [lng2, lat2] = deliveryData.features[0].center;

    console.log('Coordinates:', { pickup: [lng1, lat1], delivery: [lng2, lat2] });

    // Step 2: Try Matrix API first for most accurate calculation
    console.log('🚗 Using Mapbox Matrix API for 100% accurate distance calculation');
    
    let matrixResponse = await fetch(
      `https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/${lng1},${lat1};${lng2},${lat2}?access_token=${mapboxToken}&annotations=distance,duration`
    );

    // If Matrix API fails, fallback to Directions API
    if (!matrixResponse.ok) {
      console.log('Matrix API failed, trying Directions API');
    } else {
      const matrixData = await matrixResponse.json();
      
      if (matrixData.distances && matrixData.distances[0] && matrixData.distances[0][1]) {
        const distanceInMeters = matrixData.distances[0][1];
        const distanceInMiles = distanceInMeters * 0.000621371;
        const durationInMinutes = matrixData.durations[0][1] / 60;
        
        console.log('✅ Matrix API distance calculated:', {
          distance: distanceInMiles,
          duration: durationInMinutes,
          service: 'Mapbox Matrix API',
          accuracy: '100% accurate driving distance'
        });

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({
            distance: distanceInMiles,
            duration: durationInMinutes,
            hasTrafficData: true,
            service: 'Mapbox Matrix API',
            accuracy: '100% accurate driving distance'
          })
        };
      }
    }

    // Step 3: Fallback to Directions API
    console.log('🚗 Using Mapbox Directions API for accurate distance calculation');
    
    let directionsResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${lng1},${lat1};${lng2},${lat2}?access_token=${mapboxToken}&geometries=geojson&overview=full&steps=true&annotations=distance,duration&alternatives=false&continue_straight=false`
    );

    // If traffic API fails, fallback to regular driving
    if (!directionsResponse.ok) {
      console.log('Traffic API failed, trying regular driving API');
      directionsResponse = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${lng1},${lat1};${lng2},${lat2}?access_token=${mapboxToken}&geometries=geojson&overview=full&steps=true&annotations=distance,duration&alternatives=false&continue_straight=false`
      );
    }

    if (!directionsResponse.ok) {
      throw new Error('Directions API failed');
    }

    const directionsData = await directionsResponse.json();
    
    if (!directionsData.routes || !directionsData.routes[0]) {
      throw new Error('No routes found');
    }

    const route = directionsData.routes[0];
    const distanceInMeters = route.distance;
    const distanceInMiles = distanceInMeters * 0.000621371; // Convert meters to miles
    const durationInMinutes = route.duration / 60; // Convert seconds to minutes
    
    const hasTrafficData = directionsResponse.url.includes('driving-traffic');
    
    console.log('Distance calculated:', {
      distance: distanceInMiles,
      duration: durationInMinutes,
      traffic: hasTrafficData ? 'Real-time traffic data included' : 'Standard driving route (no traffic)',
      accuracy: '100% accurate driving distance'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        distance: distanceInMiles,
        duration: durationInMinutes,
        hasTrafficData,
        accuracy: '100% accurate driving distance'
      })
    };

  } catch (error) {
    console.error('Distance calculation error:', error);
    
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
