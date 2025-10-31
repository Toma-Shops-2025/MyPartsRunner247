import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Car, Navigation } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { loadGoogleMaps } from '@/utils/googleMapsLoader';

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
  const [orderData, setOrderData] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);

  // Fetch real order data
  const fetchOrderData = async () => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          driver:profiles!orders_driver_id_fkey(
            id,
            full_name,
            phone,
            current_lat,
            current_lng
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return;
      }

      setOrderData(order);
      setDriverData(order.driver);
      setOrderStatus(order.status);

      // Use driver's current location if available
      if (order.driver?.current_lat && order.driver?.current_lng) {
        setDriverLocation({
          lat: order.driver.current_lat,
          lng: order.driver.current_lng
        });
      }

      // Geocode addresses
      if (order.pickup_address) {
        geocodeAddress(order.pickup_address, 'pickup');
      }
      if (order.delivery_address) {
        geocodeAddress(order.delivery_address, 'delivery');
      }

    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };

  // Geocode address to get coordinates
  const geocodeAddress = (address: string, type: 'pickup' | 'delivery') => {
    if (!window.google?.maps?.Geocoder) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        
        if (type === 'pickup') {
          setPickupLocation(coords);
          addMarker(coords, 'Pickup Location', '#3B82F6');
        } else {
          setDeliveryLocation(coords);
          addMarker(coords, 'Delivery Location', '#EF4444');
        }
      }
    });
  };

  // Add marker to map
  const addMarker = (position: { lat: number; lng: number }, title: string, color: string) => {
    if (!mapRef.current) return;

    new window.google.maps.Marker({
      position,
      map: mapRef.current,
      title,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(24, 24)
      }
    });
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!mapContainer.current) return;

    let isMounted = true;
    let updateInterval: ReturnType<typeof setInterval> | null = null;

    // Load Google Maps JavaScript API using shared loader
    loadGoogleMaps(['geometry'])
      .then(() => {
        if (!isMounted || !mapContainer.current || !window.google?.maps) return;

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

        // Fetch real order data
        fetchOrderData();

        // Set up real-time updates
        updateInterval = setInterval(() => {
          if (isMounted) {
            fetchOrderData(); // Refresh order data every 30 seconds
          }
        }, 30000);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
      });

    return () => {
      isMounted = false;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
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
            <span className="flex items-center gap-2"><Car className="w-4 h-4" /> Order Status:</span>
            <span className="font-semibold capitalize text-teal-400">
              {orderStatus === 'pending' ? 'Preparing' :
               orderStatus === 'accepted' ? 'Accepted' :
               orderStatus === 'picked_up' ? 'Picked Up' :
               orderStatus === 'in_transit' ? 'In Transit' :
               orderStatus === 'delivered' ? 'Delivered' : orderStatus}
            </span>
          </div>
          {driverData && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Car className="w-4 h-4" /> Driver:</span>
              <span className="font-semibold">{driverData.full_name || 'Your driver'}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Estimated Arrival:</span>
            <span className="font-semibold">
              {orderStatus === 'delivered' ? 'Delivered' :
               orderStatus === 'in_transit' ? '15-20 minutes' :
               orderStatus === 'picked_up' ? '10-15 minutes' :
               'Calculating...'}
            </span>
          </div>
          {driverLocation && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Driver Location:</span>
              <span className="font-semibold text-xs">
                {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerTracking;