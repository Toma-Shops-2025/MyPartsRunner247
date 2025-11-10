import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PushNotificationPrompt } from '@/components/PushNotificationPrompt';
import { Car, MapPin, Clock, DollarSign, Package, CheckCircle, AlertCircle, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { locationTrackingService } from '@/services/LocationTrackingService';
import { toast } from '@/hooks/use-toast';

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
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);    
  const locationUpdateCountRef = useRef<number>(0);

  // Memoize location update handler to prevent re-renders
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    // Throttle location updates - only log/process every 10th update or if location changed significantly
    locationUpdateCountRef.current++;
    const prevLocation = lastLocationRef.current;
    
    if (!prevLocation || 
        Math.abs(prevLocation.lat - lat) > 0.001 || 
        Math.abs(prevLocation.lng - lng) > 0.001) {
      // Location changed significantly - update location tracking
      lastLocationRef.current = { lat, lng };
      
      // Only log occasionally to reduce console spam
      if (locationUpdateCountRef.current % 10 === 0) {
        // Location tracking service update would go here if needed
        // locationTrackingService.updateLocation(user?.id, lat, lng);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      checkOnboardingCompletion();
      fetchDriverData();
      checkTrackingStatus(); // Load online status from database
      
      // Check if returning from Stripe onboarding (URL params)
      const urlParams = new URLSearchParams(window.location.search);
      const stripeSuccess = urlParams.get('success');
      const stripeRefresh = urlParams.get('refresh');
      
      if (stripeSuccess === 'true' || stripeRefresh === 'true') {
        console.log('🔄 Returning from Stripe onboarding - verifying and updating connection status...');
        // Verify Stripe account status and update database
        verifyAndUpdateStripeStatus();
        
        // Clean up URL
        window.history.replaceState({}, '', '/driver-dashboard');
      }
      
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
  
  // Verify Stripe account status and update database
  const verifyAndUpdateStripeStatus = async () => {
    if (!user?.id) return;
    
    // Check if profile has stripe_account_id (it might not be in the type definition)
    const stripeAccountId = (profile as any)?.stripe_account_id;
    if (!stripeAccountId) return;
    
    try {
      console.log('🔄 Verifying Stripe account status...');
      // Call Netlify function to verify Stripe account
      const response = await fetch('/.netlify/functions/check-driver-capabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user.id })
      });
      
      if (!response.ok) {
        console.error('❌ Failed to check driver capabilities:', response.status);
        return;
      }
      
      const result = await response.json();
      console.log('📊 Stripe account status:', {
        isFullyOnboarded: result.isFullyOnboarded,
        canReceiveTransfers: result.canReceiveTransfers,
        detailsSubmitted: result.detailsSubmitted,
        chargesEnabled: result.chargesEnabled,
        payoutsEnabled: result.payoutsEnabled
      });
      
      if (result.isFullyOnboarded || result.canReceiveTransfers) {
        // Update database to mark as connected
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_connected: true })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('❌ Error updating stripe_connected:', updateError);
        } else {
          console.log('✅ Stripe connection status updated in database - stripe_connected: true');
          setHasStripeAccount(true);
          
          // Refresh profile to get updated status
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('stripe_connected')
            .eq('id', user.id)
            .single();
          
          if (updatedProfile?.stripe_connected) {
            console.log('✅ Verified: stripe_connected is now true in database');
          }
        }
      } else {
        console.log('⚠️ Stripe account not fully onboarded yet:', result);
      }
    } catch (error) {
      console.error('❌ Error verifying Stripe status:', error);
    }
  };

    // Load verification deadline after onboarding status is determined
  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      loadVerificationDeadline();
      checkTrackingStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.user_type, onboardingCompleted]);

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
        // Only log error if it's not a missing record
        if (error.code !== 'PGRST116') {
          console.error('Error checking tracking status:', error);
        }
        return;
      }
      
      // Set tracking state based on database status
      setIsTracking(data.is_online === true);
      // Only log when status changes or on initial load (reduce console spam)
      // We'll track this with a ref to avoid excessive logging
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

      if (!user?.id) return;
      
            const { data, error } = await supabase
        .from('driver_applications')
        .select('verification_deadline, status')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records gracefully                                                           

      // If table doesn't exist or query fails, skip this check
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('not found') || error.code === '42P01' || error.code === '42883' || error.code === '42703') {                            
          // Column doesn't exist (42703) or table/columns not found - skip verification deadline check
          setVerificationDeadline(null);
          return;
        }
        console.error('Error loading verification deadline:', error);
        setVerificationDeadline(null);
        return;
      }
      
      // Only show deadline if verification is not completed
      // Check if status is 'approved'
      if (data) {
        const isVerified = data.status === 'approved';
        
        // Also check profile for verification status
        if (!isVerified && user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('verification_status, driver_license_verified, insurance_verified')
            .eq('id', user.id)
            .single();
          
          // Check if driver has completed verification based on profile
          const profileVerified = profileData?.verification_status === 'approved' ||
                                 (profileData?.driver_license_verified && profileData?.insurance_verified);
          
          if (profileVerified) {
            setVerificationDeadline(null);
            return;
          }
        }
        
        // If verification is complete, don't show deadline
        if (isVerified) {
          setVerificationDeadline(null);
          return;
        }
        
        // Only set deadline if verification is still pending and deadline exists
        if (data?.verification_deadline && !isVerified) {
          const deadline = new Date(data.verification_deadline);
          setVerificationDeadline(deadline);
        } else {
          setVerificationDeadline(null);
        }
      }
    } catch (error) {
      console.error('Error loading verification deadline:', error);
      setVerificationDeadline(null);
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
        .select('stripe_connected, stripe_account_id')
        .eq('id', user.id)
        .single();

      const hasAccount = profileData?.stripe_connected || false;
      setHasStripeAccount(hasAccount);
      
      // If stripe_account_id exists but stripe_connected is false, verify with Stripe
      if (profileData?.stripe_account_id && !hasAccount) {
        console.log('⚠️ stripe_account_id exists but stripe_connected is false - verifying...');
        verifyAndUpdateStripeStatus();
      }

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
      // Optimistically update UI immediately
      setIsTracking(true);
      
      await locationTrackingService.startTracking();
      
      // Update driver online status in database (both profiles and driver_availability)
      if (user?.id) {
        // Update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            is_online: true,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error('Error updating profiles:', profileError);
        }
        
        // Update driver_availability table using RPC function
        try {
          const { error: availabilityError } = await supabase.rpc('update_driver_availability', {
            p_driver_id: user.id,
            p_is_online: true,
            p_is_available: true,
            p_max_orders: 3
          });
          
          if (availabilityError) {
            console.error('Error updating driver_availability:', availabilityError);
            // Fallback: try direct update if RPC fails
            await supabase
              .from('driver_availability')
              .upsert({
                driver_id: user.id,
                is_online: true,
                is_available: true,
                max_orders: 3,
                current_orders: 0,
                last_seen: new Date().toISOString()
              }, {
                onConflict: 'driver_id'
              });
          }
        } catch (availabilityErr) {
          console.error('Error in driver_availability update:', availabilityErr);
          // Fallback: try direct update
          await supabase
            .from('driver_availability')
            .upsert({
              driver_id: user.id,
              is_online: true,
              is_available: true,
              max_orders: 3,
              current_orders: 0,
              last_seen: new Date().toISOString()
            }, {
              onConflict: 'driver_id'
            });
        }
        
        console.log('Driver marked as online and active (synced with driver_availability)');
        
        // Start periodic last_seen updates (every 2 minutes) to keep driver "active" for dispatching
        // This ensures the automation system knows the driver is available while the app is open
        const updateLastSeen = async () => {
          // Check current tracking state, not the closure variable
          const currentTrackingState = isTracking;
          if (!currentTrackingState || !user?.id) {
            // If tracking stopped, clear interval
            if ((window as any).__lastSeenInterval) {
              clearInterval((window as any).__lastSeenInterval);
              delete (window as any).__lastSeenInterval;
            }
            return;
          }
          
          try {
            await supabase
              .from('driver_availability')
              .update({ last_seen: new Date().toISOString() })
              .eq('driver_id', user.id);
          } catch (error) {
            console.error('Error updating last_seen:', error);
          }
        };
        
        // Update immediately
        await updateLastSeen();
        
        // Then update every 2 minutes while tracking
        // Note: We update every 2 minutes, but notifications check for last 15 minutes
        // This gives a 13-minute buffer for network delays or missed updates
        const lastSeenInterval = setInterval(updateLastSeen, 2 * 60 * 1000);
        
        // Store interval ID so we can clear it later
        (window as any).__lastSeenInterval = lastSeenInterval;
        
        // Refresh profile to ensure UI has latest state
        if (profile) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('is_online')
            .eq('id', user.id)
            .single();
          
          if (updatedProfile) {
            setIsTracking(updatedProfile.is_online === true);
          }
        }

        // Check for queued orders when driver comes online
        await orderQueueService.checkQueuedOrdersForDriver(user.id);
      }
      
      console.log('Location tracking started - UI updated');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      // Revert UI state on error
      setIsTracking(false);
    }
  };

  const stopLocationTracking = async () => {
    try {
      // Optimistically update UI immediately
      setIsTracking(false);
      
      // Stop periodic last_seen updates
      if ((window as any).__lastSeenInterval) {
        clearInterval((window as any).__lastSeenInterval);
        delete (window as any).__lastSeenInterval;
      }
      
      await locationTrackingService.stopTracking();
      
      // Update driver offline status in database (both profiles and driver_availability)
      if (user?.id) {
        // Update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            is_online: false,
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (profileError) {
          console.error('Error updating profiles:', profileError);
        }
        
        // Update driver_availability table using RPC function
        try {
          const { error: availabilityError } = await supabase.rpc('update_driver_availability', {
            p_driver_id: user.id,
            p_is_online: false,
            p_is_available: false,
            p_max_orders: 3
          });
          
          if (availabilityError) {
            console.error('Error updating driver_availability:', availabilityError);
            // Fallback: try direct update if RPC fails
            await supabase
              .from('driver_availability')
              .upsert({
                driver_id: user.id,
                is_online: false,
                is_available: false,
                max_orders: 3,
                current_orders: 0,
                last_seen: new Date().toISOString()
              }, {
                onConflict: 'driver_id'
              });
          }
        } catch (availabilityErr) {
          console.error('Error in driver_availability update:', availabilityErr);
          // Fallback: try direct update
          await supabase
            .from('driver_availability')
            .upsert({
              driver_id: user.id,
              is_online: false,
              is_available: false,
              max_orders: 3,
              current_orders: 0,
              last_seen: new Date().toISOString()
            }, {
              onConflict: 'driver_id'
            });
        }
        
        console.log('Driver marked as offline and inactive (synced with driver_availability)');
        
        // Refresh profile to ensure UI has latest state
        if (profile) {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('is_online')
            .eq('id', user.id)
            .single();
          
          if (updatedProfile) {
            setIsTracking(updatedProfile.is_online === true);
          }
        }
      }
      
      console.log('Location tracking stopped - UI updated');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      // Revert UI state on error
      setIsTracking(true);
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
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-20">
        <img
          src="/driver-dashboard-background.png"
          alt="Driver dashboard background"
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-slate-950/65 backdrop-blur-[2px]" />

      <NewHeader />
      <PushNotificationPrompt />
      <DriverNotificationSystem />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-300 mb-2 drop-shadow-lg">Driver Dashboard</h1>
          <p className="text-gray-200">Welcome back, {profile?.full_name || 'Driver'}!</p>
        </div>

        {/* Location Tracking Controls - Moved to top for visibility */}
        <Card className="bg-slate-900/80 border-slate-700 mb-8 backdrop-blur">
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
                <div className="flex items-center justify-between p-4 bg-green-900/80 border border-green-700 rounded-lg backdrop-blur">
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
                    disabled={!isTracking}
                  >
                    {!isTracking ? 'Going Offline...' : 'Go Offline'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-600 rounded-lg backdrop-blur">
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
                    disabled={isTracking}
                  >
                    {isTracking ? 'Going Online...' : 'Go Online'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
            <Card className="bg-green-900/85 border-green-700 backdrop-blur">
              <CardContent className="p-6 text-white">
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
          <Card className="bg-slate-900/80 border-slate-700 backdrop-blur">
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

          <Card className="bg-slate-900/80 border-slate-700 backdrop-blur">
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

          <Card className="bg-slate-900/80 border-slate-700 backdrop-blur">
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

          <Card className="bg-slate-900/80 border-slate-700 backdrop-blur">
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
        <Card className="mb-8 bg-slate-900/80 border-slate-700 backdrop-blur">
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
                  <div key={order.id} className="border border-slate-600 rounded-lg p-4 bg-slate-800/80 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Order #{order.id.slice(0, 8)}</h3>
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
                                // Trigger payout processing
                                try {
                                  console.log('💸 Triggering payout for order:', order.id);
                                  const response = await fetch('/.netlify/functions/process-order-completion', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: order.id })
                                  });
                                  const result = await response.json();
                                  console.log('💰 Payout result:', result);
                                  
                                  if (!response.ok) {
                                    // Handle error response
                                    const errorMsg = result.details || result.error || 'Failed to process payment';
                                    const actionMsg = result.driverAction || '';
                                    toast({ 
                                      title: 'Payment Failed', 
                                      description: `${errorMsg}${actionMsg ? ` ${actionMsg}` : ''}`,
                                      variant: 'destructive'
                                    });
                                  } else if (result.success) {
                                    toast({ 
                                      title: 'Payment Processed', 
                                      description: `Driver payment processed: $${result.driverPayment}` 
                                    });
                                  } else if (result.warning) {
                                    toast({ 
                                      title: 'Payment Warning', 
                                      description: result.warning,
                                      variant: 'destructive'
                                    });
                                  }
                                } catch (e) {
                                  console.error('Failed to trigger payout function', e);
                                  toast({ 
                                    title: 'Payment Error', 
                                    description: 'Failed to process driver payout',
                                    variant: 'destructive'
                                  });
                                }
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
        <Card className="mb-8 bg-slate-900/80 border-slate-700 backdrop-blur">
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
                  <div key={order.id} className="border border-slate-600 rounded-lg p-4 bg-slate-800/80 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Order #{order.id.slice(0, 8)}</h3>
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
          onLocationUpdate={handleLocationUpdate}
          customerPhone={activeOrders[0].contact_phone || activeOrders[0].customer_phone}
          customerEmail={activeOrders[0].customer_email || activeOrders[0].contact_email}
        />
      )}
    </div>
  );
};

export default NewDriverDashboardPage;
