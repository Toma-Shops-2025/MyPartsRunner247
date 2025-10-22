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
import { Car, MapPin, Clock, DollarSign, Package, CheckCircle, AlertCircle, Star, TrendingUp } from 'lucide-react';
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

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      fetchDriverData();
    }
  }, [user, profile]);

  useEffect(() => {
    // Check if driver has Stripe account connected
    const stripeAccountId = localStorage.getItem('stripe_account_id');
    setHasStripeAccount(!!stripeAccountId);
  }, []);

  const fetchDriverData = async () => {
    try {
      // First, let's check if ANY orders exist in the database
      console.log('Checking if any orders exist in database...');
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);
      
      console.log('All orders in database:', { allOrders, allOrdersError });
      console.log('🔍 DEBUGGING: All orders details:', allOrders);
      
      // Debug: Check if the specific order ID exists
      const { data: specificOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', '79051d23-f7fd-4529-b8f8-011f3d0fdd7a');
      
      console.log('🔍 DEBUGGING: Specific order lookup:', specificOrder);
      
      // Debug: Check total count of orders
      const { count: totalOrderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      console.log('🔍 DEBUGGING: Total order count in database:', totalOrderCount);
      
      // Debug: Log each order's details
      if (allOrders && allOrders.length > 0) {
        console.log('=== DETAILED ORDER DEBUG ===');
        allOrders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            status: order.status,
            customer_id: order.customer_id,
            driver_id: order.driver_id,
            created_at: order.created_at,
            total: order.total
          });
        });
        console.log('=== END DETAILED ORDER DEBUG ===');
      }
      
      // Debug: Log each order's status and details
      if (allOrders && allOrders.length > 0) {
        console.log('=== ORDER DEBUG INFO ===');
        allOrders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            status: order.status,
            customer_id: order.customer_id,
            driver_id: order.driver_id,
            created_at: order.created_at,
            pickup_address: order.pickup_address,
            delivery_address: order.delivery_address,
            total: order.total
          });
        });
        console.log('=== END ORDER DEBUG ===');
      }

      // Fetch driver earnings

      // Fetch completed orders
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user?.id)
        .eq('status', 'delivered');

      // Fetch active orders
      console.log('Fetching active orders for driver:', user?.id);
      const { data: activeOrdersData } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', user?.id)
        .in('status', ['accepted', 'picked_up', 'in_transit']);

      const { data: availableOrdersData, error: availableOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .neq('status', 'cancelled')
        .neq('status', 'deleted')
        .limit(10)
        .order('created_at', { ascending: false });

      console.log('Available orders query result:', { availableOrdersData, availableOrdersError });
      
      // Debug: Let's also try a simpler query to see what orders exist with pending status
      const { data: pendingOrdersDebug } = await supabase
        .from('orders')
        .select('id, status, created_at, customer_id, driver_id')
        .eq('status', 'pending');
      
      console.log('=== PENDING ORDERS DEBUG ===');
      console.log('Pending orders query result:', pendingOrdersDebug);
      console.log('=== END PENDING ORDERS DEBUG ===');
      console.log('Active orders query result:', { activeOrdersData });
      console.log('Completed orders query result:', { completedOrders });

      // Log the actual order data
      if (availableOrdersData && availableOrdersData.length > 0) {
        console.log('Available order details:', availableOrdersData[0]);
        console.log('Order status:', availableOrdersData[0].status);
        console.log('Order driver_id:', availableOrdersData[0].driver_id);
        console.log('Order created_at:', availableOrdersData[0].created_at);
      }

      // Calculate earnings from completed orders (including tips)
      const totalEarnings = completedOrders?.reduce((sum, order) => {
        const baseAmount = parseFloat(order.total || 0) - parseFloat(order.tip_amount || 0);
        const tipAmount = parseFloat(order.tip_amount || 0);
        return sum + baseAmount + tipAmount; // Driver gets full amount including tips
      }, 0) || 0;
      const completedDeliveries = completedOrders?.length || 0;
      const activeDeliveries = activeOrdersData?.length || 0;

      console.log('Driver stats calculated:', { totalEarnings, completedDeliveries, activeDeliveries });
      console.log('Setting available orders to state:', availableOrdersData);
      
      // Debug: Check driver profile status
      console.log('🔍 DEBUGGING: Driver profile status:', {
        status: profile?.status,
        is_approved: profile?.is_approved,
        user_type: profile?.user_type,
        full_name: profile?.full_name
      });

      setDriverStats({
        totalEarnings,
        completedDeliveries,
        activeDeliveries,
        rating: completedDeliveries > 0 ? 4.5 : 0.0 // Mock rating
      });

      setActiveOrders(activeOrdersData || []);
      setAvailableOrders(availableOrdersData || []);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { data: updateResult, error } = await supabase
        .from('orders')
        .update({ 
          driver_id: user?.id,
          status: 'accepted'
        })
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Error accepting order:', error);
        throw error;
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('No rows were updated - order might not exist or match criteria');
        throw new Error('No rows were updated');
      }
      
      // Refresh data
      await fetchDriverData();
      alert('Order accepted successfully! You can now navigate to pickup location.');
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

  // Only redirect if we have a profile and it's not a driver
  if (profile && profile.user_type !== 'driver') {
    return <Navigate to="/" replace />;
  }
  
  // If we don't have a profile yet but we have a user, wait for it to load
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Driver Dashboard</h1>
            <p className="text-gray-300">Welcome back, {profile?.full_name || 'Driver'}!</p>
          </div>
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
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400" />
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

        {/* Stripe Connect Setup - Show if driver hasn't connected payment method */}
        {!hasStripeAccount && (
          <div className="mb-8">
            <DriverOnboarding onComplete={() => {
              setHasStripeAccount(true);
              // Refresh the page to update the UI
              window.location.reload();
            }} />
          </div>
        )}

        {/* Driver Notifications */}
        <div className="mb-8">
          <DriverNotificationSystem />
        </div>

        {/* Push Notifications */}
        <div className="mb-8">
          <PushNotificationManager />
        </div>

        {/* Mapbox Navigation Section */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <DriverNavigation
              pickupLocation={activeOrders[0].pickup_address}
              deliveryLocation={activeOrders[0].delivery_address}
              orderId={activeOrders[0].id}
              onPickupComplete={() => {
                console.log('Pickup completed for order:', activeOrders[0].id);
                // Update order status in database
                // You can add database update logic here
              }}
              onDeliveryComplete={() => {
                console.log('Delivery completed for order:', activeOrders[0].id);
                // Update order status in database
                // You can add database update logic here
              }}
              onLocationUpdate={(lat, lng) => {
                console.log('Driver location updated:', { lat, lng });
                // Start location tracking
                if (user?.id) {
                  locationTrackingService.startLocationTracking(
                    user.id,
                    activeOrders[0].id,
                    async (location) => {
                      console.log('Location tracked:', location);
                      
                      // Update driver's location in database
                      try {
                        const { error: updateError } = await supabase
                          .from('profiles')
                          .update({
                            current_lat: location.lat,
                            current_lng: location.lng,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', user.id);

                        if (updateError) {
                          console.error('Error updating driver location:', updateError);
                        } else {
                          console.log('Driver location updated in database');
                        }
                      } catch (error) {
                        console.error('Error updating driver location:', error);
                      }
                      
                      // Update order tracking status
                      locationTrackingService.updateOrderStatus(
                        activeOrders[0].id,
                        'in_transit',
                        { lat: location.lat, lng: location.lng }
                      );
                    }
                  );
                }
              }}
            />
          </div>
        )}

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
                          <span>From: {order.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Item: {order.item_description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Customer: {order.customer_id}</span>
                          <span>•</span>
                          <span>Total: ${order.total}</span>
                          {order.tip_amount > 0 && (
                            <span className="text-pink-400 font-semibold">
                              💝 Tip: ${order.tip_amount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {/* Navigation Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 flex-1"
                            onClick={() => {
                              const pickup = encodeURIComponent(order.pickup_address);
                              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pickup}`;
                              window.open(googleMapsUrl, '_blank');
                            }}
                          >
                            📍 Go to Pickup
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 flex-1"
                            onClick={() => {
                              const delivery = encodeURIComponent(order.delivery_address);
                              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${delivery}`;
                              window.open(googleMapsUrl, '_blank');
                            }}
                          >
                            🚚 Go to Delivery
                          </Button>
                        </div>
                        
                        {/* Communication Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-teal-600 text-teal-600 hover:bg-teal-50 flex-1"
                            onClick={async () => {
                              const order = activeOrders[0];
                              console.log('Call button clicked for order:', order.id);
                              console.log('Order contact_phone:', order.contact_phone);
                              
                              // Use phone number from order placement, not customer profile
                              if (order.contact_phone) {
                                const callUrl = `tel:${order.contact_phone}`;
                                console.log('Calling customer phone from order:', order.contact_phone);
                                window.open(callUrl, '_blank');
                              } else {
                                alert('Customer phone number not found in order details. Please contact support.');
                              }
                            }}
                          >
                            📞 Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-purple-600 text-purple-600 hover:bg-purple-50 flex-1"
                            onClick={async () => {
                              const order = activeOrders[0];
                              console.log('Text button clicked for order:', order.id);
                              console.log('Order contact_phone:', order.contact_phone);
                              
                              // Use phone number from order placement, not customer profile
                              if (order.contact_phone) {
                                const smsUrl = `sms:${order.contact_phone}`;
                                console.log('Texting customer phone from order:', order.contact_phone);
                                window.open(smsUrl, '_blank');
                              } else {
                                alert('Customer phone number not found in order details. Please contact support.');
                              }
                            }}
                          >
                            💬 Text
                          </Button>
                        </div>
                        
                        {/* Delivery Completion */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 flex-1"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.capture = 'environment';
                              
                              input.onchange = async (e) => {
                                const target = e.target as HTMLInputElement;
                                const file = target.files?.[0];
                                if (file) {
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const base64Image = event.target.result;
                                      
                                      const { error: photoError } = await supabase
                                        .from('delivery_photos')
                                        .insert([{
                                          order_id: order.id,
                                          driver_id: user?.id,
                                          photo_data: base64Image,
                                          created_at: new Date().toISOString()
                                        }]);

                                      if (photoError) {
                                        console.error('Error saving photo:', photoError);
                                        alert('Failed to save delivery photo. Please try again.');
                                        return;
                                      }
                                      
                                      console.log('Photo saved successfully for order:', order.id);

                                      // Use phone number from order placement
                                      const customerPhone = order.contact_phone || '502-555-0123';
                                      
                                      // Send photo to customer via EMAIL (FREE!)
                                      try {
                                        const emailResponse = await fetch('/.netlify/functions/send-delivery-email', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            orderId: order.id,
                                            customerEmail: order.customer_email || 'customer@example.com',
                                            photoData: base64Image,
                                            driverName: profile?.full_name || 'Driver'
                                          })
                                        });

                                        if (emailResponse.ok) {
                                          console.log('Delivery email sent to customer successfully!');
                                        } else {
                                          console.log('Failed to send email to customer, but continuing...');
                                        }
                                      } catch (emailError) {
                                        console.error('Error sending email to customer:', emailError);
                                        // Don't fail the whole process if email sending fails
                                      }
                                      
                                      const { error } = await supabase
                                        .from('orders')
                                        .update({ 
                                          status: 'delivered',
                                          updated_at: new Date().toISOString()
                                        })
                                        .eq('id', order.id);

                                      if (error) {
                                        console.error('Error marking delivered:', error);
                                        alert('Photo saved but failed to mark delivery as completed. Please try again.');
                                        return;
                                      }
                                      
                                      console.log('Order marked as delivered:', order.id);

                                      // Process automatic driver payment
                                      try {
                                        const paymentResponse = await fetch('/.netlify/functions/process-order-completion', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            orderId: order.id
                                          })
                                        });

                                        if (paymentResponse.ok) {
                                          const paymentData = await paymentResponse.json();
                                          console.log('Driver payment processed:', paymentData);
                                          
                                          if (paymentData.driverPayment && paymentData.success) {
                                            alert(`Delivery completed! 💰 You earned $${paymentData.driverPayment.toFixed(2)} (70% commission) - Payment sent automatically!`);
                                          } else {
                                            console.log('Payment skipped - Stripe account status:', {
                                              stripeAccountId: paymentData.stripeAccountId,
                                              stripeConnected: paymentData.stripeConnected,
                                              message: paymentData.message
                                            });
                                            alert('Delivery completed! 📸 (Payment will be processed when you connect your payment method)');
                                          }
                                        } else {
                                          console.log('Payment processing failed, but delivery marked as completed');
                                          alert('Delivery completed! 📸 (Payment will be processed when you connect your payment method)');
                                        }
                                      } catch (paymentError) {
                                        console.error('Payment processing error:', paymentError);
                                        alert('Delivery completed! 📸 (Payment will be processed when you connect your payment method)');
                                      }

                                      // Email sent automatically - no need for SMS
                                      await fetchDriverData();
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (error) {
                                    console.error('Error processing photo:', error);
                                    alert('Error processing photo: ' + error);
                                  }
                                }
                              };
                              input.click();
                            }}
                          >
                            📸 Photo & Deliver
                        </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600 text-gray-300 flex-1"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('orders')
                                  .update({ 
                                    status: 'delivered',
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('id', order.id);

                                if (error) {
                                  console.error('Error marking delivered:', error);
                                  alert('Failed to mark as delivered: ' + error.message);
                                  return;
                                }

                                // Process automatic driver payment
                                try {
                                  const paymentResponse = await fetch('/.netlify/functions/process-order-completion', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      orderId: order.id
                                    })
                                  });

                                  if (paymentResponse.ok) {
                                    const paymentData = await paymentResponse.json();
                                    console.log('Driver payment processed:', paymentData);
                                    
                                    if (paymentData.driverPayment) {
                                      alert(`Order delivered! 💰 You earned $${paymentData.driverPayment.toFixed(2)} (70% commission) - Payment sent automatically!`);
                                    } else {
                                      alert('Order delivered! 🎉 (Payment will be processed when you connect your payment method)');
                                    }
                                  } else {
                                    console.log('Payment processing failed, but delivery marked as completed');
                                    alert('Order delivered! 🎉 (Payment will be processed when you connect your payment method)');
                                  }
                                } catch (paymentError) {
                                  console.error('Payment processing error:', paymentError);
                                  alert('Order delivered! 🎉 (Payment will be processed when you connect your payment method)');
                                }

                                await fetchDriverData();
                              } catch (error) {
                                console.error('Error marking delivered:', error);
                                alert('Error marking delivered: ' + error);
                              }
                            }}
                          >
                            ✅ Delivered
                        </Button>
                        </div>
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
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Available Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableOrders.length > 0 ? (
                <div className="space-y-4">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="bg-gray-700 rounded-lg p-4 relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-white">Order #{order.id}</span>
                        <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>From: {order.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Item: {order.item_description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status: {order.status}</span>
                          <div className="text-right">
                            <span className="font-bold text-green-400">Total: ${order.total}</span>
                            {order.tip_amount > 0 && (
                              <div className="text-pink-400 text-sm">
                                💝 Tip: ${order.tip_amount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                          onClick={() => handleAcceptOrder(order.id)}
                        >
                        Accept Order
                      </Button>
                      </div>
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
