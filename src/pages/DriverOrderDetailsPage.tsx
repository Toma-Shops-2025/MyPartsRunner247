import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NewHeader from '@/components/NewHeader';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { MapPin, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DriverOrderDetailsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) {
        console.error('Error loading order', error);
      }
      setOrder(data || null);
      setLoading(false);
    };
    load();
  }, [orderId]);

  const accept = async () => {
    if (!user?.id || !orderId) return;
    const { error } = await supabase
      .from('orders')
      .update({ driver_id: user.id, status: 'accepted' })
      .eq('id', orderId);
    if (error) {
      console.error('Accept failed', error);
      toast({ title: 'Failed to accept order', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Order accepted', description: 'Navigate to pickup when ready.' });
    navigate('/driver-dashboard');
  };

  const updateStatus = async (newStatus: 'picked_up' | 'delivered') => {
    if (!orderId) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) {
      console.error('Update status failed', error);
      toast({ title: 'Failed to update status', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    toast({ title: `Order ${newStatus.replace('_', ' ')}`, description: `Status updated to ${newStatus}.` });
    // Reload order to reflect current status
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    setOrder(data || null);
    if (newStatus === 'delivered') {
      // Trigger driver payout processing on server
      try {
        console.log('💸 Triggering payout for order:', orderId);
        const response = await fetch('/.netlify/functions/process-order-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
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
      navigate('/driver-dashboard');
    }
  };

  const completeDelivery = async () => {
    if (!orderId) return;
    const confirmed = window.confirm('Complete delivery and mark this order as delivered?');
    if (!confirmed) return;
    await updateStatus('delivered');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
        <NewHeader />
        <div className="max-w-3xl mx-auto py-8">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">Order not found.</CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-400" /> Order #{String(order.id).slice(0, 8)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-300" />
                <span>Pickup: {order.pickup_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-300" />
                <span>Delivery: {order.delivery_address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-200">
              <DollarSign className="w-4 h-4 text-yellow-300" />
              <span>Total: ${order.total}</span>
            </div>
            <div className="text-gray-300">Status: {order.status}</div>

            {profile?.user_type === 'driver' && order.status === 'pending' && (
              <div className="pt-2">
                <Button onClick={accept} className="bg-teal-600 hover:bg-teal-700">Accept Order</Button>
              </div>
            )}

            {profile?.user_type === 'driver' && order.status === 'accepted' && (
              <div className="pt-2">
                <Button onClick={() => updateStatus('picked_up')} className="bg-blue-600 hover:bg-blue-700">Mark Picked Up</Button>
              </div>
            )}

            {profile?.user_type === 'driver' && order.status === 'picked_up' && (
              <div className="pt-2">
                <Button onClick={() => updateStatus('delivered')} className="bg-green-600 hover:bg-green-700">Mark Delivered</Button>
              </div>
            )}

            {profile?.user_type === 'driver' && order.status !== 'delivered' && (
              <div className="pt-2">
                <Button onClick={completeDelivery} variant="outline">Complete Delivery</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DriverOrderDetailsPage;


