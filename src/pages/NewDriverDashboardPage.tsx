import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import DriverNotificationSystem from '@/components/DriverNotificationSystem';
import DriverOnboarding from '@/components/DriverOnboarding';
import DriverNavigation from '@/components/DriverNavigation';
import DocumentExpirationWarning from '@/components/DocumentExpirationWarning';
import { orderQueueService } from '@/services/OrderQueueService';
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      checkOnboardingCompletion();
      fetchDriverData();
      
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (!onboardingCompleted) {
          console.log('Loading timeout reached, assuming onboarding completed');
          setLoadingTimeout(true);
          setOnboardingCompleted(true);
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [user, profile, onboardingCompleted]);

  // Load verification deadline after onboarding status is determined
  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      loadVerificationDeadline();
      checkTrackingStatus();
    }
  }, [user, profile, onboardingCompleted]);

  // Check if driver is currently tracking/online
  const checkTrackingStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_online, status')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking tracking status:', error);
        return;
      }
      
      // Set tracking state based on database status
      setIsTracking(data.is_online === true);
      console.log('Tracking status loaded from database:', data.is_online);
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  const checkOnboardingCompletion = async () => {
    if (!user?.id) return;

    try {
      // Add a small delay to allow database updates to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, assume onboarding is completed to avoid infinite loading
        console.log('Database error, assuming onboarding completed to prevent infinite loading');
        setOnboardingCompleted(true);
        return;
      }

      const isCompleted = profileData?.onboarding_completed === true;
      setOnboardingCompleted(isCompleted);

      // If onboarding is not completed, redirect to verification page
      if (!isCompleted) {
        console.log('Driver onboarding not completed, redirecting to verification');
        navigate('/driver-verification');
        return;
      }
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      // If there's an error, assume onboarding is completed to avoid infinite loading
      console.log('Exception occurred, assuming onboarding completed to prevent infinite loading');
      setOnboardingCompleted(true);
    }
  };

  const loadVerificationDeadline = async () => {
    try {
      // Only load verification deadline if onboarding is not completed
      if (onboardingCompleted) {
        setVerificationDeadline(null);
        return;
      }

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
          status: 'accepted'
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error accepting order:', error);
        return;
      }

      // Refresh data
      await fetchDriverData();
      // Navigate to details so the driver sees next steps
      navigate(`/driver/orders/${orderId}`);
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      await locationTrackingService.startTracking();
      setIsTracking(true);
      
      // Update driver online status in database
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ 
            is_online: true,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        console.log('Driver marked as online and active');

        // Check for queued orders when driver comes online
        await orderQueueService.checkQueuedOrdersForDriver(user.id);
      }
      
      console.log('Location tracking started - UI updated');
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = async () => {
    try {
      await locationTrackingService.stopTracking();
      setIsTracking(false);
      
      // Update driver offline status in database
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ 
            is_online: false,
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        console.log('Driver marked as offline and inactive');
      }
      
      console.log('Location tracking stopped - UI updated');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!user || profile?.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }

  // If onboarding is not completed, show loading while redirecting
  if (!onboardingCompleted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-300">
            {loadingTimeout ? 'Loading driver dashboard... (timeout reached)' : 'Loading driver dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <DriverNotificationSystem />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Driver Dashboard</h1>
          <p className="text-gray-300">Welcome back, {profile?.full_name || 'Driver'}!</p>
        </div>

        {/* Document Expiration Warning */}
        <DocumentExpirationWarning />

        {/* Verification Deadline Alert */}
        {verificationDeadline && (
          <div className="mb-6 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-yellow-300 font-medium">
                Verification Deadline: {timeRemaining}
              </span>
            </div>
          </div>
        )}

        {/* Stripe Account Status */}
        {hasStripeAccount ? (
          <div className="mb-8">
            <Card className="bg-green-900 border-green-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-300">Payment Account Connected!</h3>
                    <p className="text-green-200">You'll receive automatic payments for completed deliveries.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mb-8">
            <DriverOnboarding onComplete={() => setHasStripeAccount(true)} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-400 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">
                    ${driverStats.totalEarnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-400 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {driverStats.completedDeliveries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-400 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-white">
                    {driverStats.activeDeliveries}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-400 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Rating</p>
                  <p className="text-2xl font-bold text-white">
                    {driverStats.rating.toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Package className="w-6 h-6 text-teal-400 mr-2" />
              Active Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOrders.length > 0 ? (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-300">
                          {order.pickup_address} → {order.delivery_address}
                        </p>
                        <p className="text-sm font-medium text-green-400">
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
                        {(order.status === 'picked_up' || order.status === 'accepted') && (
                          <Button
                            onClick={async () => {
                              try {
                                await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);
                                await fetchDriverData();
                              } catch (e) {
                                console.error('Error marking delivered', e);
                              }
                            }}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Deliveries</h3>
                <p className="text-gray-400">You don't have any active deliveries at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Orders */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <MapPin className="w-6 h-6 text-teal-400 mr-2" />
              Available Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No orders available</h3>
                <p className="text-gray-300">Check back later for new delivery opportunities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Order #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-300">
                          {order.pickup_address} → {order.delivery_address}
                        </p>
                        <p className="text-sm font-medium text-green-400">
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
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <MapPin className="w-6 h-6 text-teal-400 mr-2" />
              Location Tracking
              {isTracking && (
                <div className="ml-3 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-green-400 text-sm font-medium">Active</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isTracking ? (
                <div className="flex items-center justify-between p-4 bg-green-900 border border-green-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                    <div>
                      <p className="text-green-300 font-medium">Location tracking is active</p>
                      <p className="text-green-200 text-sm">Your location is being shared with the platform</p>
                    </div>
                  </div>
                  <Button
                    onClick={stopLocationTracking}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Go Offline
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-gray-300 font-medium">Location tracking is inactive</p>
                      <p className="text-gray-400 text-sm">Start tracking to share your location</p>
                    </div>
                  </div>
                  <Button
                    onClick={startLocationTracking}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Go Online
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DriverNavigation component - only shown when there's an active order */}
      {activeOrders.length > 0 && (
        <DriverNavigation
          pickupLocation={activeOrders[0].pickup_address || 'Pickup location'}
          deliveryLocation={activeOrders[0].delivery_address || 'Delivery location'}
          orderId={activeOrders[0].id || 'unknown'}
          onPickupComplete={() => {
            console.log('Pickup completed');
            // Handle pickup completion
          }}
          onDeliveryComplete={() => {
            console.log('Delivery completed');
            // Handle delivery completion
          }}
          onLocationUpdate={(lat, lng) => {
            console.log('Location updated:', lat, lng);
            // Handle location update
          }}
          customerPhone={activeOrders[0].customer_phone}
          customerEmail={activeOrders[0].customer_email}
        />
      )}
    </div>
  );
};

export default NewDriverDashboardPage;
