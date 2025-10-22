import { useState, useEffect } from 'react';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
}

interface UseLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsKey) {
      console.warn('Google Maps API key not configured, using fallback location data');
      // Return fallback location data when API key is not available
      return {
        lat,
        lng,
        city: 'Louisville',
        state: 'Kentucky',
        country: 'United States',
        formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
      };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsKey}`
      );

      if (!response.ok) {
        throw new Error(`Failed to reverse geocode location: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results[0]) {
        console.warn('Google Maps API returned no results, using fallback location data');
        // Return fallback location data when API returns no results
        return {
          lat,
          lng,
          city: 'Louisville',
          state: 'Kentucky',
          country: 'United States',
          formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
        };
      }

      const result = data.results[0];
      const addressComponents = result.address_components;

      // Extract city and state from address components
      let city = 'Unknown';
      let state = 'Unknown';
      let country = 'Unknown';

      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      return {
        lat,
        lng,
        city,
        state,
        country,
        formattedAddress: result.formatted_address
      };
    } catch (error) {
      console.warn('Google Maps API error, using fallback location data:', error);
      // Return fallback location data when API fails
      return {
        lat,
        lng,
        city: 'Louisville',
        state: 'Kentucky',
        country: 'United States',
        formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
      };
    }
  };

  const getCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      const locationData = await reverseGeocode(latitude, longitude);
      
      setLocation(locationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect location on first load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation
  };
};
