import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Star } from 'lucide-react';

interface NearbyOrder {
  id: string;
  pickupaddress: string;
  deliveryaddress: string;
  total: number;
  itemdescription: string;
  distance: number;
  profiles?: {
    rating: number;
  };
}

const NearbyOrdersPanel: React.FC = () => {
  const { user, profile } = useAuth();
  const [nearbyOrders, setNearbyOrders] = useState<NearbyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (profile?.is_online && driverLocation) {
      fetchNearbyOrders();
      const interval = setInterval(fetchNearbyOrders, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [profile?.is_online, driverLocation]);

  const fetchNearbyOrders = async () => {
    if (!driverLocation || !user) return;

    setLoading(true);
    try {
      // Direct database query instead of Edge Function
      // For now, get all pending orders (in production, you'd implement proper distance calculation)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNearbyOrders(data || []);
    } catch (error) {
      console.error('Error fetching nearby orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          driverid: user?.id, 
          status: 'accepted' 
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Remove accepted order from the list
      setNearbyOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  // Get location updates from LocationTracker
  const handleLocationUpdate = (lat: number, lng: number) => {
    setDriverLocation({ lat, lng });
  };

  if (profile?.user_type !== 'driver' || !profile?.is_online) {
    return null;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Nearby Orders</span>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nearbyOrders.length === 0 ? (
          <p className="text-gray-300 text-center py-4">
            {driverLocation ? 'No nearby orders available' : 'Enable location to see nearby orders'}
          </p>
        ) : (
          <div className="space-y-4">
            {nearbyOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 bg-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-white">#{order.id.slice(0, 8)}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                      {order.distance.toFixed(1)}km away
                    </Badge>
                    <div className="text-lg font-bold text-green-400">
                      ${order.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {order.profiles?.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-300">
                      Customer: {order.profiles.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                <div className="space-y-1 text-sm text-gray-300 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    From: {order.pickupaddress}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    To: {order.deliveryaddress}
                  </div>
                  <div>Item: {order.itemdescription}</div>
                </div>

                <Button 
                  onClick={() => acceptOrder(order.id)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  size="sm"
                >
                  Accept Order
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbyOrdersPanel;