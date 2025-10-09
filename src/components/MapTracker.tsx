import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone } from 'lucide-react';

interface MapTrackerProps {
  orderId: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
}

const MapTracker: React.FC<MapTrackerProps> = ({ orderId }) => {
  const [driverLocation, setDriverLocation] = useState<LocationData | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('');

  useEffect(() => {
    fetchOrderDetails();
    
    // Subscribe to real-time location updates
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'driver_locations',
          filter: `orderid=eq.${orderId}`
        }, 
        (payload: any) => {
          if (payload.new) {
            setDriverLocation({
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              timestamp: payload.new.updated_at
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          driver_locations(latitude, longitude, updated_at)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      setOrderStatus(data.status);
      if (data.driver_locations && data.driver_locations.length > 0) {
        const latest = data.driver_locations[0];
        setDriverLocation({
          latitude: latest.latitude,
          longitude: latest.longitude,
          timestamp: latest.updated_at
        });
      }
      
      // Calculate estimated arrival (mock calculation)
      if (data.status === 'in_transit') {
        const now = new Date();
        const arrival = new Date(now.getTime() + 15 * 60000); // 15 minutes from now
        setEstimatedArrival(arrival.toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Looking for a driver...';
      case 'accepted':
        return 'Driver is heading to pickup location';
      case 'picked_up':
        return 'Item picked up, heading to delivery location';
      case 'in_transit':
        return 'On the way to you!';
      case 'delivered':
        return 'Delivered successfully!';
      default:
        return 'Processing your order...';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Live Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={
            orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
            orderStatus === 'in_transit' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }>
            {orderStatus.replace('_', ' ').toUpperCase()}
          </Badge>
          {estimatedArrival && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              ETA: {estimatedArrival}
            </div>
          )}
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            {getStatusMessage(orderStatus)}
          </div>
          
          {/* Mock map placeholder */}
          <div className="bg-gradient-to-br from-blue-100 to-green-100 h-48 rounded-lg flex items-center justify-center relative">
            <div className="text-gray-600">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">Live map would appear here</div>
              {driverLocation && (
                <div className="text-xs mt-2">
                  Driver location: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                </div>
              )}
            </div>
            
            {/* Animated driver marker */}
            {orderStatus === 'in_transit' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {(orderStatus === 'accepted' || orderStatus === 'picked_up' || orderStatus === 'in_transit') && (
          <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Your Driver</div>
              <div className="text-xs text-gray-600">John D. • 4.9 ⭐</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
                <Phone className="w-4 h-4 text-teal-600" />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
              ['accepted', 'picked_up', 'in_transit', 'delivered'].includes(orderStatus) 
                ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>Driver assigned</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
              ['picked_up', 'in_transit', 'delivered'].includes(orderStatus) 
                ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>Item picked up</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
              ['in_transit', 'delivered'].includes(orderStatus) 
                ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>On the way</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
              orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span>Delivered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapTracker;