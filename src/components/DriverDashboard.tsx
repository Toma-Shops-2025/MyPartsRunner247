import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Package, CheckCircle, XCircle, Star } from 'lucide-react';
import DriverNotifications from './DriverNotifications';
import LocationTracker from './LocationTracker';
import NearbyOrdersPanel from './NearbyOrdersPanel';

interface DriverOrder {
  id: string;
  status: string;
  pickupaddress: string;
  deliveryaddress: string;
  total: number;
  createdat: string;
  itemdescription: string;
  customerid: string;
}

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDriverOrders();
      fetchAvailableOrders();
      fetchEarnings();
    }
  }, [user]);

  const fetchDriverOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driverid', user.id)
        .order('createdat', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching driver orders:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .is('driverid', null)
        .eq('status', 'pending')
        .order('createdat', { ascending: true });
      
      if (error) throw error;
      setAvailableOrders(data || []);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('total')
        .eq('driverid', user.id)
        .eq('status', 'delivered');
      
      if (error) throw error;
      const totalEarnings = data?.reduce((sum, order) => sum + (order.total * 0.8), 0) || 0;
      setEarnings(totalEarnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
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
      fetchDriverOrders();
      fetchAvailableOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchDriverOrders();
      if (newStatus === 'delivered') {
        fetchEarnings();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button
            variant={isOnline ? "destructive" : "default"}
            onClick={() => setIsOnline(!isOnline)}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Today's Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${earnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => ['accepted', 'picked_up', 'in_transit'].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DriverNotifications />
        </div>
        <div>
          <LocationTracker />
        </div>
      </div>

      <NearbyOrdersPanel />
      {isOnline && availableOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium">#{order.id.slice(0, 8)}</div>
                    <div className="text-lg font-bold text-green-600">${order.total.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
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
                    className="w-full"
                  >
                    Accept Order
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No orders yet</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium">#{order.id.slice(0, 8)}</div>
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div>From: {order.pickupaddress}</div>
                    <div>To: {order.deliveryaddress}</div>
                    <div>Item: {order.itemdescription}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold">${order.total.toFixed(2)}</div>
                    {order.status === 'accepted' && (
                      <Button onClick={() => updateOrderStatus(order.id, 'picked_up')}>
                        Mark Picked Up
                      </Button>
                    )}
                    {order.status === 'picked_up' && (
                      <Button onClick={() => updateOrderStatus(order.id, 'in_transit')}>
                        Start Delivery
                      </Button>
                    )}
                    {order.status === 'in_transit' && (
                      <Button onClick={() => updateOrderStatus(order.id, 'delivered')}>
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;