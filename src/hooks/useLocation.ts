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
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,locality,neighborhood,address`
    );

    if (!response.ok) {
      throw new Error('Failed to reverse geocode location');
    }

    const data = await response.json();
    const feature = data.features[0];

    if (!feature) {
      throw new Error('No location data found');
    }

    // Extract city and state from context
    const context = feature.context || [];
    const place = context.find((c: any) => c.id.startsWith('place.'));
    const region = context.find((c: any) => c.id.startsWith('region.'));
    const country = context.find((c: any) => c.id.startsWith('country.'));

    return {
      lat,
      lng,
      city: place?.text || feature.text || 'Unknown',
      state: region?.text || 'Unknown',
      country: country?.text || 'Unknown',
      formattedAddress: feature.place_name || `${place?.text || 'Unknown'}, ${region?.text || 'Unknown'}`
    };
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
