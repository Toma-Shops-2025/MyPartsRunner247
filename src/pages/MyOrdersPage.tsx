import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, MapPin, Clock, DollarSign, User, Phone, MessageCircle, Heart, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MyOrdersPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [isAddingTip, setIsAddingTip] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      console.log('Fetching orders for customer:', user?.id);
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      console.log('Orders fetched:', ordersData);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40';
      case 'in_transit':
        return 'bg-sky-500/20 text-sky-200 border border-sky-400/40';
      case 'accepted':
        return 'bg-purple-500/20 text-purple-200 border border-purple-400/40';
      case 'picked_up':
        return 'bg-orange-500/20 text-orange-200 border border-orange-400/40';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40';
      case 'cancelled':
        return 'bg-red-500/20 text-red-200 border border-red-400/40';
      default:
        return 'bg-white/10 text-white/90 border border-white/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'in_transit': return 'In Transit';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Your order is waiting for a driver to accept it.';
      case 'accepted': return 'A driver has accepted your order and is on their way to pickup.';
      case 'picked_up': return 'Your order has been picked up and is on its way to you.';
      case 'in_transit': return 'Your order is currently being delivered.';
      case 'delivered': return 'Your order has been successfully delivered.';
      case 'cancelled': return 'This order has been cancelled.';
      default: return 'Order status unknown.';
    }
  };

  const handleAddTip = (order: any) => {
    setSelectedOrder(order);
    setShowTipModal(true);
    setTipAmount('');
  };

  const handleSubmitTip = async () => {
    if (!selectedOrder || !tipAmount || parseFloat(tipAmount) <= 0) {
      alert('Please enter a valid tip amount.');
      return;
    }

    setIsAddingTip(true);
    try {
      const additionalTip = parseFloat(tipAmount);
      const newTotal = parseFloat(selectedOrder.total) + additionalTip;
      const newTipAmount = (parseFloat(selectedOrder.tip_amount) || 0) + additionalTip;

      // Update the order with the additional tip
      const { error } = await supabase
        .from('orders')
        .update({
          total: newTotal,
          tip_amount: newTipAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) {
        throw error;
      }

      alert(`Thank you for the $${additionalTip.toFixed(2)} tip! Your driver will appreciate it. 💝`);
      setShowTipModal(false);
      setSelectedOrder(null);
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error adding tip:', error);
      alert('Failed to add tip. Please try again.');
    } finally {
      setIsAddingTip(false);
    }
  };

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto"></div>
          <p className="text-white/80">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 -z-20">
        <img
          src="/my-orders-background.png"
          alt="My orders background"
          className="h-full w-full object-cover object-[center_top]"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/25 to-black/50 pointer-events-none" />
      <NewHeader />
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/50 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
            My Orders
          </h1>
          <p className="text-white/85 drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]">
            Track delivery progress, view driver details, and manage tips for each order.
          </p>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-xl transition-shadow bg-black/45 border border-white/20 text-white backdrop-blur"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-white/85 drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]">
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                <p className="text-sm text-white/85 mt-2 drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]">
                  {getStatusDescription(order.status)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-white/70">
                      <Package className="mr-2 h-4 w-4" />
                      Items
                    </div>
                    <p className="font-semibold text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
                      {order.item_description || 'No description'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-white/70">
                      <MapPin className="mr-2 h-4 w-4" />
                      Pickup
                    </div>
                    <p className="font-semibold text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
                      {order.pickup_address}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-white/70">
                      <MapPin className="mr-2 h-4 w-4" />
                      Delivery
                    </div>
                    <p className="font-semibold text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
                      {order.delivery_address}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-white/70">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Total
                    </div>
                    <p className="font-semibold text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                  </div>
                </div>

                {order.driver_id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-white/80" />
                      <span className="text-sm text-white/85 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]">
                        Driver: <span className="font-medium">Assigned (ID: {order.driver_id.slice(0, 8)})</span>
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  {/* Show Track Order button for all active orders */}
                  {(order.status === 'pending' ||
                    order.status === 'accepted' ||
                    order.status === 'picked_up' ||
                    order.status === 'in_transit') && (
                    <Button
                      className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/50"
                      size="sm"
                      onClick={() => navigate(`/track/${order.id}`)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Track Order
                    </Button>
                  )}
                  {/* Show Add Tip button for delivered orders */}
                  {order.status === 'delivered' && (
                    <Button 
                      className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-900/50"
                      size="sm"
                      onClick={() => handleAddTip(order)}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Add Tip
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    className="border-white/40 text-white hover:bg-white/15"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {orders.length === 0 && (
          <Card className="bg-black/40 border border-white/15 text-white backdrop-blur text-center">
            <CardContent className="py-12 space-y-3">
              <Package className="mx-auto h-12 w-12 text-white/50 drop-shadow mb-4" />
              <h3 className="text-lg font-semibold text-white drop-shadow">No orders yet</h3>
              <p className="text-white/75 drop-shadow">
                When you place a delivery, it will appear here for easy tracking.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border border-white/10">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order Details</CardTitle>
                    <p className="text-sm text-white/60">Order #{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedOrder(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white/70">Status</label>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">Total</label>
                    <p className="font-medium text-white">${parseFloat(selectedOrder.total).toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-white/70">Items</label>
                  <p className="mt-1 text-white">{selectedOrder.item_description || 'No description'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white/70">Pickup Address</label>
                    <p className="mt-1 text-white">{selectedOrder.pickup_address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70">Delivery Address</label>
                    <p className="mt-1 text-white">{selectedOrder.delivery_address}</p>
                  </div>
                </div>
                
                {selectedOrder.driver_id && (
                  <div>
                    <label className="text-sm font-medium text-white/70">Driver</label>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-white">
                        Driver Assigned (ID: {selectedOrder.driver_id.slice(0, 8)})
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-white/70">Order Timeline</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-white/90">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span>Order placed - {new Date(selectedOrder.created_at).toLocaleString()}</span>
                    </div>
                    {selectedOrder.status !== 'pending' && (
                      <div className="flex items-center text-sm text-white/90">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span>Driver assigned - {selectedOrder.driver_id ? 'Driver ID: ' + selectedOrder.driver_id.slice(0, 8) : 'Pending'}</span>
                      </div>
                    )}
                    {selectedOrder.status === 'delivered' && (
                      <div className="flex items-center text-sm text-white/90">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span>Order delivered - {new Date(selectedOrder.updated_at || selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tip Modal */}
        {showTipModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-slate-900 text-white border border-white/10">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-500" />
                      Add Tip for Driver
                    </CardTitle>
                    <p className="text-sm text-white/60">Order #{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowTipModal(false)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-sm text-white/80 mb-2">
                    Current order total: ${parseFloat(selectedOrder.total).toFixed(2)}
                  </p>
                  {selectedOrder.tip_amount > 0 && (
                    <p className="text-sm text-pink-300">
                      Current tip: ${parseFloat(selectedOrder.tip_amount).toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="tipAmount" className="text-white/80">
                    Additional Tip Amount
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-white/60" />
                    <Input
                      id="tipAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Tips go directly to your driver and are greatly appreciated!
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTipModal(false)}
                    disabled={isAddingTip}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={handleSubmitTip}
                    disabled={isAddingTip}
                  >
                    {isAddingTip ? 'Adding Tip...' : 'Add Tip'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;