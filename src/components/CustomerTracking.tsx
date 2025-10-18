import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Car, Navigation } from 'lucide-react';

interface CustomerTrackingProps {
  orderId: string;
}

const CustomerTracking: React.FC<CustomerTrackingProps> = ({ orderId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const driverMarker = useRef<any | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('Pending');
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string>('Calculating...');

  // Initialize Google Maps
  useEffect(() => {
    if (!mapContainer.current) return;

    const googleApiKey = 'AIzaSyBNIjxagh6NVm-NQz0lyUMlGAQJEkReJ7o';
    if (!googleApiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if (window.google && window.window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainer.current || !window.google) return;

      // Initialize map
      mapRef.current = new window.google.maps.Map(mapContainer.current, {
        center: { lat: 38.2527, lng: -85.7585 }, // Louisville center
        zoom: 12,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Mock order data (in real app, fetch from your backend)
      const mockOrder = {
        pickup_address: '5120 Cynthia Drive, Louisville, KY 40291',
        delivery_address: '7101 Cedar Springs Boulevard, Louisville, KY 40291',
      };

      // Geocode addresses
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: mockOrder.pickup_address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          setPickupLocation({ lat: location.lat(), lng: location.lng() });
          
          // Add pickup marker
          new window.google.maps.Marker({
            position: location,
            map: mapRef.current,
            title: 'Pickup Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24)
            }
          });
        }
      });

      geocoder.geocode({ address: mockOrder.delivery_address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          setDeliveryLocation({ lat: location.lat(), lng: location.lng() });
          
          // Add delivery marker
          new window.google.maps.Marker({
            position: location,
            map: mapRef.current,
            title: 'Delivery Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EF4444"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24)
            }
          });
        }
      });

      // Simulate real-time driver location updates
      const interval = setInterval(() => {
        // In a real app, this would fetch from your backend
        setDriverLocation(prev => {
          if (!prev) return { lat: 38.2527, lng: -85.7585 }; // Start at Louisville center
          const newLat = prev.lat + (Math.random() - 0.5) * 0.001;
          const newLng = prev.lng + (Math.random() - 0.5) * 0.001;
          return { lat: newLat, lng: newLng };
        });
        setOrderStatus('In Transit');
        setEta('15-20 minutes'); // Mock ETA
      }, 3000); // Update every 3 seconds

      return () => {
        clearInterval(interval);
      };
    };

    loadGoogleMaps();

    return () => {
      if (driverMarker.current) {
        driverMarker.current.setMap(null);
      }
    };
  }, [orderId]);

  // Update driver marker when location changes
  useEffect(() => {
    if (mapRef.current && driverLocation) {
      if (!driverMarker.current) {
        driverMarker.current = new window.google.maps.Marker({
          position: { lat: driverLocation.lat, lng: driverLocation.lng },
          map: mapRef.current,
          title: 'Driver Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#10B981"/>
                <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });
      } else {
        driverMarker.current.setPosition({ lat: driverLocation.lat, lng: driverLocation.lng });
      }
      
      // Center map on driver location
      mapRef.current.setCenter({ lat: driverLocation.lat, lng: driverLocation.lng });
    }
  }, [driverLocation]);

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Tracking Order: {orderId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 rounded-lg overflow-hidden mb-4">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        <div className="space-y-3 text-gray-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Car className="w-4 h-4" /> Driver Status:</span>
            <span className="font-semibold capitalize text-teal-400">{orderStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Estimated Arrival:</span>
            <span className="font-semibold">{eta}</span>
          </div>
          {driverLocation && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Driver Location:</span>
              <span className="font-semibold">{driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerTracking;