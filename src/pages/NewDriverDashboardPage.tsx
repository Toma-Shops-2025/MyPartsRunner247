import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import DriverNotificationSystem from '@/components/DriverNotificationSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Clock, DollarSign, Package, CheckCircle, AlertCircle, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NewDriverDashboardPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [driverStats, setDriverStats] = useState({
    totalEarnings: 0.00,
    completedDeliveries: 0,
    activeDeliveries: 0,
    rating: 0.0
  });
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      fetchDriverData();
    }
  }, [user, profile]);

  const fetchDriverData = async () => {
    try {
      // Fetch driver earnings
      const { data: earnings } = await supabase
        .from('earnings')
        .select('amount')
        .eq('driver_id', user?.id);

      // Fetch completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user?.id)
        .eq('status', 'delivered');

      // Fetch active orders
      const { data: activeOrdersData } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user?.id)
        .in('status', ['accepted', 'picked_up', 'in_transit']);

      // Fetch available orders
      const { data: availableOrdersData } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .limit(10);

      const totalEarnings = earnings?.reduce((sum, earning) => sum + parseFloat(earning.amount), 0) || 0;
      const completedDeliveries = completedOrders?.length || 0;
      const activeDeliveries = activeOrdersData?.length || 0;

      setDriverStats({
        totalEarnings,
        completedDeliveries,
        activeDeliveries,
        rating: completedDeliveries > 0 ? 4.5 : 0.0 // Mock rating
      });

      setActiveOrders(activeOrdersData || []);
      setAvailableOrders(availableOrdersData || []);
      
      console.log('Available orders fetched:', availableOrdersData?.length || 0, availableOrdersData);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          driver_id: user?.id,
          status: 'accepted'
        })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh data
      await fetchDriverData();
      alert('Order accepted successfully!');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  const handleViewEarnings = () => {
    navigate('/earnings');
  };

  const handleViewCompleted = () => {
    navigate('/my-orders');
  };

  const handleViewRating = () => {
    // For now, show an alert. In the future, this could navigate to a dedicated ratings page
    alert('Driver ratings and reviews feature coming soon! This will show your customer feedback and ratings.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (profile?.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Driver Dashboard</h1>
          <p className="text-gray-300">Welcome back, {profile?.full_name || 'Driver'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:border-teal-400 cursor-pointer transition-colors" onClick={handleViewEarnings}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">${driverStats.totalEarnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:border-teal-400 cursor-pointer transition-colors" onClick={handleViewCompleted}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">{driverStats.completedDeliveries}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view history</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active</p>
                  <p className="text-2xl font-bold text-white">{driverStats.activeDeliveries}</p>
                  {profile?.is_online && (
                    <p className="text-xs text-green-400 mt-1">✓ Online & Ready</p>
                  )}
                </div>
                {(() => {
                  console.log('Driver status debug:', {
                    is_approved: profile?.is_approved,
                    is_online: profile?.is_online,
                    user_type: profile?.user_type
                  });
                  return profile?.is_approved && profile?.is_online ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:border-teal-400 cursor-pointer transition-colors" onClick={handleViewRating}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white">{driverStats.rating.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view reviews</p>
                </div>
                <Star className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Notifications */}
        <div className="mb-8">
          <DriverNotificationSystem />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Orders */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Active Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-white">Order #{order.id}</span>
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">{order.status}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>From: {order.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {order.delivery}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Item: {order.item}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Customer: {order.customer}</span>
                          <span>•</span>
                          <span>{order.phone}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                          Call Customer
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No active deliveries</p>
                  <p className="text-sm text-gray-500 mt-1">
                    You'll see your active deliveries here when you accept an order.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Orders */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Available Orders
                </CardTitle>
                <Button 
                  onClick={fetchDriverData}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Refresh Orders
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {availableOrders.length > 0 ? (
                <div className="space-y-4">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-white">Order #{order.id}</span>
                        <span className="text-xs text-gray-400">{order.time}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>From: {order.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {order.delivery}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Item: {order.item}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance: {order.distance}</span>
                          <span className="font-bold text-green-400">Fee: {order.fee}</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700">
                        Accept Order
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No available orders</p>
                  <p className="text-sm text-gray-500 mt-1">
                    New orders will appear here when customers place them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewDriverDashboardPage;
