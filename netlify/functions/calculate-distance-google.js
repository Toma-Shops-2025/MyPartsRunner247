// Google Distance Matrix API distance calculation
exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { pickupAddress, deliveryAddress } = JSON.parse(event.body);
    
    if (!pickupAddress || !deliveryAddress) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Addresses required' }) };
    }

    console.log('🌍 Google Distance Matrix calculation');
    console.log('📍 Pickup:', pickupAddress);
    console.log('📍 Delivery:', deliveryAddress);

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleApiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Google Maps API key not configured' })
      };
    }

    console.log('🔑 Google API key check:', googleApiKey ? 'Found' : 'Missing');
    console.log('🔑 API key length:', googleApiKey ? googleApiKey.length : 0);

    // Use Google Distance Matrix API
    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickupAddress)}&destinations=${encodeURIComponent(deliveryAddress)}&units=imperial&key=${googleApiKey}`;
    
    console.log('🚗 Calling Google Distance Matrix API...');
    console.log('🔗 Full URL:', distanceMatrixUrl);
    
    const response = await fetch(distanceMatrixUrl);
    
    if (!response.ok) {
      console.error('❌ Google API failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Google Distance Matrix API failed', 
          status: response.status,
          statusText: response.statusText,
          details: errorText
        })
      };
    }

    const data = await response.json();
    console.log('📊 Google API response:', JSON.stringify(data, null, 2));

    if (data.status !== 'OK') {
      console.error('❌ Google API error:', data.status, data.error_message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Google API error', 
          status: data.status,
          details: data.error_message || data.status,
          fullResponse: data
        })
      };
    }

    if (!data.rows?.[0]?.elements?.[0]) {
      console.error('❌ No distance data found');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No distance data found' })
      };
    }

    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      console.error('❌ Distance calculation failed:', element.status);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Distance calculation failed', details: element.status })
      };
    }

    // Convert meters to miles
    const distanceInMeters = element.distance.value;
    const distanceInMiles = distanceInMeters * 0.000621371;
    const durationInMinutes = element.duration.value / 60;

    console.log('✅ Google result:', { distance: distanceInMiles, duration: durationInMinutes });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        distance: distanceInMiles,
        duration: durationInMinutes,
        service: 'Google Distance Matrix API',
        accuracy: '100% accurate driving distance'
      })
    };

  } catch (error) {
    console.error('❌ Distance calculation error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Distance calculation failed', details: error.message })
    };
  }
};
