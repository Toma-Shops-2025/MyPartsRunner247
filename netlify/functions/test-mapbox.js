// Test Mapbox token and geocoding
exports.handler = async (event, context) => {
  try {
    const mapboxToken = process.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    console.log('🔑 Token check:', mapboxToken ? 'Found' : 'Missing');
    console.log('🔑 Token preview:', mapboxToken ? `${mapboxToken.substring(0, 15)}...` : 'None');
    
    if (!mapboxToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No Mapbox token found' })
      };
    }

    // Test with a simple Louisville address
    const testAddress = 'Louisville KY';
    console.log('🧪 Testing geocoding with:', testAddress);
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(testAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`
    );
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Geocoding result:', data);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          token: `${mapboxToken.substring(0, 10)}...`,
          geocoding: data
        })
      };
    } else {
      const errorText = await response.text();
      console.log('❌ Geocoding failed:', response.status, errorText);
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Geocoding failed',
          status: response.status,
          details: errorText
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
