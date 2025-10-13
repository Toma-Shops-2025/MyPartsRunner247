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
      // First, let's check if ANY orders exist in the database
      console.log('Checking if any orders exist in database...');
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);
      
      console.log('All orders in database:', { allOrders, allOrdersError });

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
      console.log('Active orders query result:', { activeOrdersData });
      console.log('Completed orders query result:', { completedOrders });

      // Calculate earnings from completed orders
      const totalEarnings = completedOrders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const completedDeliveries = completedOrders?.length || 0;
      const activeDeliveries = activeOrdersData?.length || 0;

      console.log('Driver stats calculated:', { totalEarnings, completedDeliveries, activeDeliveries });

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
                {profile?.is_approved && profile?.is_online ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                )}
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

        {/* Navigation Map Section */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Navigation Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Driver Navigation Workflow</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => {
                          const order = activeOrders[0];
                          const pickup = encodeURIComponent(order.pickup_address);
                          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pickup}`;
                          window.open(googleMapsUrl, '_blank');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        📍 Go to Pickup
                      </Button>
                      <Button 
                        onClick={() => {
                          const order = activeOrders[0];
                          const delivery = encodeURIComponent(order.delivery_address);
                          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${delivery}`;
                          window.open(googleMapsUrl, '_blank');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        🚚 Go to Delivery
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                            onClick={() => {
                              const customerPhone = '502-555-0123';
                              const smsUrl = `sms:${customerPhone}`;
                              window.open(smsUrl, '_blank');
                            }}
                          >
                            📞 Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-purple-600 text-purple-600 hover:bg-purple-50 flex-1"
                            onClick={() => {
                              const customerPhone = '502-555-0123';
                              const smsUrl = `sms:${customerPhone}`;
                              window.open(smsUrl, '_blank');
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
                                        alert('Photo saved but delivery not marked. Please try again.');
                                        return;
                                      }

                                      const customerPhone = '502-555-0123';
                                      const smsMessage = `Your delivery has been completed! 📦 Photo proof attached. Order #${order.id}`;
                                      const smsUrl = `sms:${customerPhone}?body=${encodeURIComponent(smsMessage)}`;
                                      
                                      const { error } = await supabase
                                        .from('orders')
                                        .update({ 
                                          status: 'delivered',
                                          updated_at: new Date().toISOString()
                                        })
                                        .eq('id', order.id);

                                      if (error) {
                                        console.error('Error marking delivered:', error);
                                        alert('Photo saved but delivery not marked. Please try again.');
                                        return;
                                      }

                                      alert('Delivery completed with photo proof! 📸');
                                      window.open(smsUrl, '_blank');
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

                                alert('Order delivered successfully! 🎉');
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
                      {/* SAMPLE ORDER Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          SAMPLE ORDER
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start mb-2 opacity-30">
                        <span className="text-sm font-medium text-white">Order #{order.id}</span>
                        <span className="text-xs text-gray-400">{order.time}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300 mb-4 opacity-30">
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
                          <span className="font-bold text-green-400">Total: ${order.total}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-30 pointer-events-none">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gray-500 cursor-not-allowed"
                          disabled
                        >
                        Accept Order
                      </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-500 text-gray-500 cursor-not-allowed"
                          disabled
                           onClick={async () => {
                             if (confirm('Are you sure you want to delete this order? This cannot be undone.')) {
                               try {
                                 console.log('Attempting to delete order:', order.id);
                                 
                                 // Try multiple deletion approaches
                                 let deleted = false;
                                 
                                 // Method 1: Standard delete
                                 try {
                                   const { data, error } = await supabase
                                     .from('orders')
                                     .delete()
                                     .eq('id', order.id)
                                     .select();
                                   
                                   console.log('Standard delete result:', { data, error });
                                   
                                   if (!error && data && data.length > 0) {
                                     deleted = true;
                                   }
                                 } catch (e) {
                                   console.log('Standard delete failed:', e);
                                 }
                                 
                                 // Method 2: Force delete with different approach
                                 if (!deleted) {
                                   try {
                                     const { data, error } = await supabase
                                       .from('orders')
                                       .delete()
                                       .eq('id', order.id);
                                     
                                     console.log('Force delete result:', { data, error });
                                     deleted = true;
                                   } catch (e) {
                                     console.log('Force delete failed:', e);
                                   }
                                 }
                                 
                                 // Method 3: Update status to 'deleted' instead of delete
                                 if (!deleted) {
                                   try {
                                     const { data, error } = await supabase
                                       .from('orders')
                                       .update({ status: 'deleted' })
                                       .eq('id', order.id)
                                       .select();
                                     
                                     console.log('Status update to deleted result:', { data, error });
                                     deleted = true;
                                   } catch (e) {
                                     console.log('Status update to deleted failed:', e);
                                   }
                                 }
                                 
                                 if (deleted) {
                                   alert('Order removed successfully! Refreshing dashboard...');
                                 } else {
                                   alert('Order could not be deleted, but refreshing dashboard anyway...');
                                 }
                                 
                                 // Force a complete page refresh with aggressive cache busting
                                 setTimeout(() => {
                                   // Clear all possible caches
                                   if ('caches' in window) {
                                     caches.keys().then(names => {
                                       names.forEach(name => caches.delete(name));
                                     });
                                   }
                                   
                                   // Clear localStorage and sessionStorage
                                   localStorage.removeItem('mock_profile');
                                   sessionStorage.clear();
                                   
                                   // Force hard refresh with multiple cache busting parameters
                                   const baseUrl = window.location.href.split('?')[0];
                                   const timestamp = Date.now();
                                   window.location.href = `${baseUrl}?t=${timestamp}&force=1&nocache=1&refresh=${Math.random()}`;
                                 }, 1000);
                              } catch (error) {
                                console.error('Error deleting order:', error);
                                alert('Error deleting order: ' + error);
                                // Still refresh even on error
                                window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now() + '&force=1';
                              }
                            }
                           }}
                        >
                          🗑️ Delete
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
