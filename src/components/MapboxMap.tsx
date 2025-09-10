import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, Car } from 'lucide-react';

interface MapboxMapProps {
  pickupAddress: string;
  deliveryAddress: string;
  driverLocation?: { lat: number; lng: number };
  orderStatus?: string;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  pickupAddress,
  deliveryAddress,
  driverLocation,
  orderStatus,
  onLocationUpdate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Check if Mapbox is available
        if (typeof window === 'undefined' || !import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
          setError('Mapbox not configured');
          return;
        }

        // Dynamically import mapbox-gl
        const mapboxgl = await import('mapbox-gl');
        
        if (!mapContainer.current) return;

        // Initialize map
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-83.0458, 42.3314], // Detroit coordinates as default
          zoom: 10
        });

        map.current.on('load', () => {
          setIsLoaded(true);
          
          // Add pickup marker
          new mapboxgl.Marker({ color: '#10b981' })
            .setLngLat([-83.0458, 42.3314]) // Mock coordinates
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-green-600">Pickup Location</h3>
                <p class="text-sm">${pickupAddress}</p>
              </div>
            `))
            .addTo(map.current);

          // Add delivery marker
          new mapboxgl.Marker({ color: '#3b82f6' })
            .setLngLat([-83.0458, 42.3314]) // Mock coordinates
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-blue-600">Delivery Location</h3>
                <p class="text-sm">${deliveryAddress}</p>
              </div>
            `))
            .addTo(map.current);

          // Add driver marker if location provided
          if (driverLocation) {
            new mapboxgl.Marker({ color: '#f59e0b' })
              .setLngLat([driverLocation.lng, driverLocation.lat])
              .setPopup(new mapboxgl.Popup().setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold text-orange-600">Driver Location</h3>
                  <p class="text-sm">Your driver is here</p>
                </div>
              `))
              .addTo(map.current);
          }
        });

        // Handle location updates
        if (navigator.geolocation && onLocationUpdate) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              onLocationUpdate(location);
            },
            (error) => {
              console.error('Geolocation error:', error);
            }
          );
        }

      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to load map');
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [pickupAddress, deliveryAddress, driverLocation, onLocationUpdate]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-blue-600 bg-blue-100';
      case 'picked_up': return 'text-purple-600 bg-purple-100';
      case 'in_transit': return 'text-indigo-600 bg-indigo-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'Looking for driver...';
      case 'accepted': return 'Driver assigned';
      case 'picked_up': return 'Picked up';
      case 'in_transit': return 'In transit';
      case 'delivered': return 'Delivered';
      default: return 'Order placed';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-gray-600 mb-4">
            Mapbox integration is not configured. Please add your Mapbox access token to environment variables.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <p><strong>Pickup:</strong> {pickupAddress}</p>
            <p><strong>Delivery:</strong> {deliveryAddress}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Order Tracking
          {orderStatus && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderStatus)}`}>
              {getStatusText(orderStatus)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Container */}
          <div 
            ref={mapContainer} 
            className="w-full h-64 rounded-lg border border-gray-200"
            style={{ minHeight: '256px' }}
          />

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Pickup Location</h4>
                <p className="text-sm text-green-700">{pickupAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Delivery Location</h4>
                <p className="text-sm text-blue-700">{deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Driver Status */}
          {driverLocation && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Car className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">Driver Location</h4>
                <p className="text-sm text-orange-700">
                  Driver is at: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              Estimated Time
            </Button>
          </div>

          {!isLoaded && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapboxMap;
