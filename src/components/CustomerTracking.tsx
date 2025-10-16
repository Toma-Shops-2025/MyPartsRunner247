import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import mapboxgl from 'mapboxgl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Car, Navigation } from 'lucide-react';

interface CustomerTrackingProps {
  orderId: string;
  pickupLocation: string;
  deliveryLocation: string;
  driverLocation?: { lat: number; lng: number };
  driverName?: string;
  estimatedArrival?: string;
  orderStatus: 'preparing' | 'picked_up' | 'in_transit' | 'delivered';
}

const CustomerTracking: React.FC<CustomerTrackingProps> = ({
  orderId,
  pickupLocation,
  deliveryLocation,
  driverLocation,
  driverName = 'Your driver',
  estimatedArrival,
  orderStatus
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [route, setRoute] = useState<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-85.7585, 38.2527], // Louisville center
      zoom: 12,
      accessToken: mapboxToken
    });

    // Add navigation control
    const nav = new mapboxgl.NavigationControl();
    map.current.addControl(nav, 'top-right');

    // Add pickup and delivery markers
    if (pickupLocation && deliveryLocation) {
      addLocationMarkers();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [pickupLocation, deliveryLocation]);

  // Update driver location
  useEffect(() => {
    if (driverLocation && map.current) {
      updateDriverLocation(driverLocation);
    }
  }, [driverLocation]);

  const addLocationMarkers = async () => {
    if (!map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    try {
      // Geocode pickup location
      const pickupResponse = await fetch(
        `https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(pickupLocation)}.json?access_token=${mapboxToken}&limit=1`
      );
      const pickupData = await pickupResponse.json();
      
      if (pickupData.features?.[0]) {
        const [lng, lat] = pickupData.features[0].center;
        
        // Add pickup marker
        const pickupMarker = new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-green-600">Pickup Location</h3>
              <p class="text-sm text-gray-600">${pickupLocation}</p>
            </div>
          `))
          .addTo(map.current);
      }

      // Geocode delivery location
      const deliveryResponse = await fetch(
        `https://api.mapbox.com/geocoding/v1/mapbox.places/${encodeURIComponent(deliveryLocation)}.json?access_token=${mapboxToken}&limit=1`
      );
      const deliveryData = await deliveryResponse.json();
      
      if (deliveryData.features?.[0]) {
        const [lng, lat] = deliveryData.features[0].center;
        
        // Add delivery marker
        const deliveryMarker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-red-600">Delivery Location</h3>
              <p class="text-sm text-gray-600">${deliveryLocation}</p>
            </div>
          `))
          .addTo(map.current);
      }
    } catch (error) {
      console.error('Error adding location markers:', error);
    }
  };

  const updateDriverLocation = (location: { lat: number; lng: number }) => {
    if (!map.current) return;

    // Remove existing driver marker
    if (driverMarker.current) {
      driverMarker.current.remove();
    }

    // Add new driver marker
    driverMarker.current = new mapboxgl.Marker({ 
      color: '#3b82f6',
      scale: 1.2
    })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-blue-600">${driverName}</h3>
          <p class="text-sm text-gray-600">Currently here</p>
        </div>
      `))
      .addTo(map.current);

    // Center map on driver location
    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 14,
      duration: 1000
    });
  };

  const getStatusInfo = () => {
    switch (orderStatus) {
      case 'preparing':
        return {
          text: 'Preparing your order',
          color: 'text-yellow-400',
          icon: <Clock className="w-4 h-4" />
        };
      case 'picked_up':
        return {
          text: 'Order picked up - on the way',
          color: 'text-blue-400',
          icon: <Car className="w-4 h-4" />
        };
      case 'in_transit':
        return {
          text: 'In transit to you',
          color: 'text-blue-400',
          icon: <Navigation className="w-4 h-4" />
        };
      case 'delivered':
        return {
          text: 'Delivered successfully',
          color: 'text-green-400',
          icon: <MapPin className="w-4 h-4" />
        };
      default:
        return {
          text: 'Processing',
          color: 'text-gray-400',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-4">
      {/* Order Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {statusInfo.icon}
            Order Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                orderStatus === 'delivered' ? 'bg-green-500' : 
                orderStatus === 'in_transit' ? 'bg-blue-500' : 'bg-yellow-500'
              }`}>
                {statusInfo.icon}
              </div>
              <div>
                <p className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </p>
                <p className="text-gray-300 text-sm">
                  Order #{orderId}
                </p>
              </div>
            </div>
            {estimatedArrival && (
              <div className="text-right">
                <p className="text-teal-400 font-semibold">
                  ETA: {estimatedArrival}
                </p>
                <p className="text-gray-300 text-sm">
                  {driverName}
                </p>
              </div>
            )}
          </div>

          {/* Driver Location */}
          {driverLocation && (
            <div className="p-3 bg-blue-900 border border-blue-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" />
                <span className="text-blue-200 text-sm">
                  Driver location updated in real-time
                </span>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Pickup:</span>
              <span className="text-white text-sm">{pickupLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Delivery:</span>
              <span className="text-white text-sm">{deliveryLocation}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div 
            ref={mapContainer} 
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Driver</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerTracking;
