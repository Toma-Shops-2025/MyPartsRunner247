import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import CustomerTracking from '@/components/CustomerTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [orderStatus, setOrderStatus] = useState<'preparing' | 'picked_up' | 'in_transit' | 'delivered'>('preparing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
      startLocationPolling();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      
      // Try to load from localStorage first
      const storedOrder = localStorage.getItem(`order_tracking_${orderId}`);
      if (storedOrder) {
        const order = JSON.parse(storedOrder);
        setOrderData(order);
        setOrderStatus(order.status);
        if (order.driverLocation) {
          setDriverLocation(order.driverLocation);
        }
      } else {
        // Fallback: create mock order data for demo
        const mockOrder = {
          id: orderId,
          pickup_address: '5120 Cynthia Drive, Louisville, Kentucky 40291',
          delivery_address: '7101 Cedar Springs Boulevard, Louisville, Kentucky 40291',
          status: 'in_transit',
          driver_name: 'John Driver',
          estimated_arrival: '2:30 PM'
        };
        setOrderData(mockOrder);
        setOrderStatus('in_transit');
      }
    } catch (error) {
      console.error('Error loading order data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationPolling = () => {
    // Poll for location updates every 30 seconds
    const interval = setInterval(() => {
      if (orderId) {
        // Try to get latest location from localStorage
        const storedOrder = localStorage.getItem(`order_tracking_${orderId}`);
        if (storedOrder) {
          const order = JSON.parse(storedOrder);
          if (order.driverLocation) {
            setDriverLocation(order.driverLocation);
          }
          setOrderStatus(order.status);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  const refreshLocation = () => {
    loadOrderData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <NewHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-4">Order Not Found</h1>
              <p className="text-gray-300 mb-6">We couldn't find the order you're looking for.</p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Track Your Order</h1>
              <p className="text-gray-300">Order #{orderId}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={refreshLocation}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => navigate('/')}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>

        {/* Tracking Component */}
        <CustomerTracking
          orderId={orderId || ''}
        />

        {/* Order Details */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-2">Pickup Address</h3>
                <p className="text-white">{orderData.pickup_address}</p>
              </div>
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-2">Delivery Address</h3>
                <p className="text-white">{orderData.delivery_address}</p>
              </div>
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-2">Driver</h3>
                <p className="text-white">{orderData.driver_name || 'Your driver'}</p>
              </div>
              <div>
                <h3 className="text-gray-300 text-sm font-medium mb-2">Status</h3>
                <p className={`font-semibold ${
                  orderStatus === 'delivered' ? 'text-green-400' : 
                  orderStatus === 'in_transit' ? 'text-blue-400' : 'text-yellow-400'
                }`}>
                  {orderStatus === 'preparing' ? 'Preparing' :
                   orderStatus === 'picked_up' ? 'Picked Up' :
                   orderStatus === 'in_transit' ? 'In Transit' : 'Delivered'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerTrackingPage;
