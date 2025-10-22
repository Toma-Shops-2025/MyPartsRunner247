import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface AddressSuggestion {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  onUseCurrentLocation?: () => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address",
  className = "",
  onUseCurrentLocation
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number>();

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!mapboxToken) {
      console.warn('Mapbox access token not configured');
      // Provide helpful fallback suggestions
      const fallbackSuggestions: AddressSuggestion[] = [
        {
          id: 'manual-entry',
          text: 'Enter address manually',
          place_name: 'Type the complete address without autocomplete',
          center: [0, 0] as [number, number]
        },
        {
          id: 'current-location',
          text: 'Use current location',
          place_name: 'Click the location button to use GPS',
          center: [0, 0] as [number, number]
        },
        {
          id: 'common-addresses',
          text: 'Common Louisville addresses',
          place_name: 'Try: 123 Main St, Louisville, KY or 456 Oak Ave, Louisville, KY',
          center: [0, 0] as [number, number]
        }
      ];
      setSuggestions(fallbackSuggestions);
      setShowSuggestions(true);
      return;
    }

    setLoading(true);
    console.log('Searching for addresses:', query);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=address&country=us&limit=5`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Mapbox response:', data);

      // Convert Mapbox format to our format
      const suggestions: AddressSuggestion[] = data.features?.map((feature: any, index: number) => ({
        id: feature.id || `mapbox-${index}`,
        text: feature.text,
        place_name: feature.place_name,
        center: feature.center as [number, number]
      })) || [];
      
      setSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      console.log('Setting fallback suggestions due to API error');
      
      // Show helpful fallback suggestions when API fails
      const fallbackSuggestions: AddressSuggestion[] = [
        {
          id: 'manual-entry',
          text: 'Enter address manually',
          place_name: 'Type the complete address without autocomplete',
          center: [0, 0] as [number, number]
        },
        {
          id: 'current-location',
          text: 'Use current location',
          place_name: 'Click the location button to use GPS',
          center: [0, 0] as [number, number]
        },
        {
          id: 'common-addresses',
          text: 'Common Louisville addresses',
          place_name: 'Try: 123 Main St, Louisville, KY or 456 Oak Ave, Louisville, KY',
          center: [0, 0] as [number, number]
        }
      ];
      
      console.log('Fallback suggestions:', fallbackSuggestions);
      setSuggestions(fallbackSuggestions);
      setShowSuggestions(true);
      console.log('Suggestions set, showSuggestions:', true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    const address = suggestion.place_name;
    
    // If we have coordinates from Mapbox, use them
    if (suggestion.center[0] !== 0 && suggestion.center[1] !== 0) {
      const [lng, lat] = suggestion.center;
      onChange(address);
      onSelect(address, { lat, lng });
      setShowSuggestions(false);
      return;
    }
    
    // If no coordinates, try to geocode using Google Maps
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (googleMapsKey) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsKey}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.results[0]) {
          const location = data.results[0].geometry.location;
          onChange(address);
          onSelect(address, { lat: location.lat, lng: location.lng });
        } else {
          // Fallback without coordinates
          onChange(address);
          onSelect(address, { lat: 0, lng: 0 });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback without coordinates
        onChange(address);
        onSelect(address, { lat: 0, lng: 0 });
      }
    } else {
      // Fallback without coordinates
      onChange(address);
      onSelect(address, { lat: 0, lng: 0 });
    }
    
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    if (onUseCurrentLocation) {
      onUseCurrentLocation();
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get address using Google Maps
      const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsKey}`
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'OK' && data.results[0]) {
          const address = data.results[0].formatted_address;
          onChange(address);
          onSelect(address, { lat: latitude, lng: longitude });
        }
      }
    } catch (error) {
      console.error('Current location error:', error);
      alert('Failed to get current location');
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);


  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`pr-20 ${className}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-2"
          onClick={handleUseCurrentLocation}
          title="Use my current location"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 mx-auto"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.place_name}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : value.length >= 3 ? (
            <div className="p-3 text-center text-gray-500">
              No addresses found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
