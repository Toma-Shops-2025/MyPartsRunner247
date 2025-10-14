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

    console.log('Calculating distance using free geocoding service:', pickupAddress, 'to', deliveryAddress);

    // Use a free geocoding service to get coordinates
    const [pickupResponse, deliveryResponse] = await Promise.all([
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupAddress)}&limit=1`),
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`)
    ]);

    if (!pickupResponse.ok || !deliveryResponse.ok) {
      throw new Error('Geocoding service request failed');
    }

    const [pickupData, deliveryData] = await Promise.all([
      pickupResponse.json(),
      deliveryResponse.json()
    ]);

    if (!pickupData[0] || !deliveryData[0]) {
      throw new Error('Could not geocode addresses');
    }

    const pickupLat = parseFloat(pickupData[0].lat);
    const pickupLng = parseFloat(pickupData[0].lon);
    const deliveryLat = parseFloat(deliveryData[0].lat);
    const deliveryLng = parseFloat(deliveryData[0].lon);

    // Calculate distance using Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = (deliveryLat - pickupLat) * Math.PI / 180;
    const dLng = (deliveryLng - pickupLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickupLat * Math.PI / 180) * Math.cos(deliveryLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInMiles = R * c;

    // Estimate duration (roughly 30 mph average)
    const durationInMinutes = (distanceInMiles / 30) * 60;
    
    console.log('Free geocoding result:', {
      pickup: { lat: pickupLat, lng: pickupLng },
      delivery: { lat: deliveryLat, lng: deliveryLng },
      distance: distanceInMiles,
      duration: durationInMinutes,
      accuracy: 'Coordinate-based calculation (free service)'
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
        accuracy: 'Coordinate-based calculation (free service)',
        service: 'OpenStreetMap Nominatim (free)'
      })
    };

  } catch (error) {
    console.error('Free distance calculation error:', error);
    
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
