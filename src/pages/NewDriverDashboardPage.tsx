import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import DriverNotificationSystem from '@/components/DriverNotificationSystem';
import DriverOnboarding from '@/components/DriverOnboarding';
import DriverNavigation from '@/components/DriverNavigation';
import PushNotificationManager from '@/components/PushNotificationManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Clock, DollarSign, Package, CheckCircle, AlertCircle, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { locationTrackingService } from '@/services/LocationTrackingService';

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
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [verificationDeadline, setVerificationDeadline] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      fetchDriverData();
      loadVerificationDeadline();
    }
  }, [user, profile]);

  const loadVerificationDeadline = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select('verification_deadline')
        .eq('user_id', user?.id)
        .single();
      
      if (data?.verification_deadline) {
        const deadline = new Date(data.verification_deadline);
        setVerificationDeadline(deadline);
      }
    } catch (error) {
      console.error('Error loading verification deadline:', error);
    }
  };

  const fetchDriverData = async () => {
    if (!user?.id) return;

    try {
      setStatsLoading(true);

      // Fetch available orders
      const { data: availableOrdersData, error: availableError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (availableError) {
        console.error('Error fetching available orders:', availableError);
      } else {
        setAvailableOrders(availableOrdersData || []);
      }

      // Fetch active orders
      const { data: activeOrdersData, error: activeError } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'picked_up'])
        .order('created_at', { ascending: false });

      if (activeError) {
        console.error('Error fetching active orders:', activeError);
      } else {
        setActiveOrders(activeOrdersData || []);
      }

      // Fetch completed orders for stats
      const { data: completedOrdersData, error: completedError } = await supabase
        .from('orders')
        .select('total')
        .eq('driver_id', user.id)
        .eq('status', 'delivered');

      if (completedError) {
        console.error('Error fetching completed orders:', completedError);
      } else {
        const totalEarnings = completedOrdersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
        const completedDeliveries = completedOrdersData?.length || 0;
        
        setDriverStats(prev => ({
          ...prev,
          totalEarnings,
          completedDeliveries,
          activeDeliveries: activeOrdersData?.length || 0
        }));
      }

      // Check Stripe account status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('stripe_connected')
        .eq('id', user.id)
        .single();

      setHasStripeAccount(profileData?.stripe_connected || false);

    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Countdown timer for verification deadline
  useEffect(() => {
    if (!verificationDeadline) return;

    const updateCountdown = () => {
      const now = new Date();
      const timeLeft = verificationDeadline.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setTimeRemaining('Deadline passed');
        return;
      }
      
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeRemaining(`${days} days, ${hours} hours remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hours, ${minutes} minutes remaining`);
      } else {
        setTimeRemaining(`${minutes} minutes remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [verificationDeadline]);

  const acceptOrder = async (orderId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          driver_id: user.id, 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error accepting order:', error);
        return;
      }

      // Refresh data
      await fetchDriverData();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      await locationTrackingService.startTracking();
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = async () => {
    try {
      await locationTrackingService.stopTracking();
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user || profile?.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      <DriverNotificationSystem />
      <PushNotificationManager />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Driver Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name || 'Driver'}!</p>
        </div>

        {/* Verification Deadline Alert */}
        {verificationDeadline && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                Verification Deadline: {timeRemaining}
              </span>
            </div>
          </div>
        )}

        {/* Driver Onboarding */}
        {!hasStripeAccount && (
          <div className="mb-8">
            <DriverOnboarding onComplete={() => setHasStripeAccount(true)} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${driverStats.totalEarnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {driverStats.completedDeliveries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {driverStats.activeDeliveries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {driverStats.rating.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-6 h-6 text-teal-600 mr-2" />
                Active Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          {order.pickup_address} → {order.delivery_address}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          ${order.total}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`/driver/orders/${order.id}`)}
                          size="sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-6 h-6 text-teal-600 mr-2" />
              Available Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders available</h3>
                <p className="text-gray-600">Check back later for new delivery opportunities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          {order.pickup_address} → {order.delivery_address}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          ${order.total}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => acceptOrder(order.id)}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Accept Order
                        </Button>
                        <Button
                          onClick={() => navigate(`/driver/orders/${order.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Tracking Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-6 h-6 text-teal-600 mr-2" />
              Location Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={startLocationTracking}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Tracking
              </Button>
              <Button
                onClick={stopLocationTracking}
                variant="outline"
              >
                Stop Tracking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DriverNavigation />
    </div>
  );
};

export default NewDriverDashboardPage;
