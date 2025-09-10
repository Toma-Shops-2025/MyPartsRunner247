import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, Package, User, Phone, MessageCircle, Star } from 'lucide-react';

interface OrderTrackingSystemProps {
  orderId: string;
  onClose?: () => void;
}

interface OrderStatus {
  id: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
  total: number;
  driver?: {
    name: string;
    phone: string;
    rating: number;
    vehicle: string;
  };
  estimatedDelivery?: string;
  actualDelivery?: string;
  specialInstructions?: string;
  createdAt: string;
}

const OrderTrackingSystem: React.FC<OrderTrackingSystemProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    fetchOrderDetails();
    // In a real app, you'd set up real-time updates here
    const interval = setInterval(fetchOrderDetails, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // Mock data - replace with actual API call
      const mockOrder: OrderStatus = {
        id: orderId,
        status: 'in_transit',
        pickupAddress: 'AutoZone - 123 Main St, Detroit, MI',
        deliveryAddress: '456 Oak Avenue, Detroit, MI',
        itemDescription: 'Brake pads, Oil filter, Spark plugs',
        total: 45.99,
        driver: {
          name: 'John Smith',
          phone: '(555) 123-4567',
          rating: 4.8,
          vehicle: '2019 Honda Civic'
        },
        estimatedDelivery: '2:30 PM',
        specialInstructions: 'Please ring doorbell twice',
        createdAt: '2024-01-16T10:30:00Z'
      };
      
      setOrder(mockOrder);
      setCurrentLocation({ lat: 42.3314, lng: -83.0458 }); // Detroit coordinates
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { 
        label: 'Pending', 
        color: 'bg-yellow-100 text-yellow-800',
        progress: 10,
        description: 'Looking for a driver...'
      },
      accepted: { 
        label: 'Accepted', 
        color: 'bg-blue-100 text-blue-800',
        progress: 25,
        description: 'Driver is on the way to pickup location'
      },
      picked_up: { 
        label: 'Picked Up', 
        color: 'bg-purple-100 text-purple-800',
        progress: 50,
        description: 'Items picked up, heading to delivery location'
      },
      in_transit: { 
        label: 'In Transit', 
        color: 'bg-indigo-100 text-indigo-800',
        progress: 75,
        description: 'On the way to delivery location'
      },
      delivered: { 
        label: 'Delivered', 
        color: 'bg-green-100 text-green-800',
        progress: 100,
        description: 'Successfully delivered!'
      },
      cancelled: { 
        label: 'Cancelled', 
        color: 'bg-red-100 text-red-800',
        progress: 0,
        description: 'Order was cancelled'
      }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getStatusSteps = () => {
    return [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'accepted', label: 'Driver Assigned', icon: User },
      { key: 'picked_up', label: 'Picked Up', icon: Package },
      { key: 'in_transit', label: 'In Transit', icon: Clock },
      { key: 'delivered', label: 'Delivered', icon: Star }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600">We couldn't find an order with that ID.</p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const statusSteps = getStatusSteps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
          <p className="text-gray-600">{order.itemDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Order Progress</span>
              <span className="text-sm text-gray-500">{statusInfo.progress}%</span>
            </div>
            <Progress value={statusInfo.progress} className="h-2" />
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Status Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = statusSteps.findIndex(s => s.key === order.status) >= index;
              const isCurrent = step.key === order.status;
              
              return (
                <div key={step.key} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-teal-500 text-white' : 
                    isCurrent ? 'bg-teal-100 text-teal-600' : 
                    'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isCompleted ? 'text-gray-900' : 
                      isCurrent ? 'text-teal-600' : 
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-gray-600">{statusInfo.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Driver Information */}
      {order.driver && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Driver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold">{order.driver.name}</p>
                <p className="text-sm text-gray-600">{order.driver.vehicle}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{order.driver.rating}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{order.pickupAddress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              Delivery Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </CardContent>
        </Card>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{order.specialInstructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Items</span>
              <span className="text-sm font-medium">{order.itemDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Order Total</span>
              <span className="text-sm font-medium">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Order Date</span>
              <span className="text-sm font-medium">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            {order.estimatedDelivery && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Delivery</span>
                <span className="text-sm font-medium">{order.estimatedDelivery}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTrackingSystem;
