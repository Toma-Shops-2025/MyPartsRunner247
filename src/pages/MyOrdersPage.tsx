import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Clock, DollarSign } from 'lucide-react';

const MyOrdersPage: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const mockOrders = [
    {
      id: 'ORD-001',
      status: 'delivered',
      pickup: 'AutoZone - Main St',
      delivery: '123 Oak Avenue',
      items: 'Brake Pads, Oil Filter',
      total: 45.99,
      date: '2024-01-15',
      driver: 'John Smith'
    },
    {
      id: 'ORD-002',
      status: 'in_transit',
      pickup: 'NAPA Auto Parts',
      delivery: '456 Pine Street',
      items: 'Engine Oil, Air Filter',
      total: 32.50,
      date: '2024-01-16',
      driver: 'Sarah Johnson'
    },
    {
      id: 'ORD-003',
      status: 'pending',
      pickup: 'O\'Reilly Auto Parts',
      delivery: '789 Elm Drive',
      items: 'Spark Plugs, Battery',
      total: 89.25,
      date: '2024-01-16',
      driver: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'in_transit': return 'In Transit';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600">Track and manage your delivery orders</p>
        </div>

        <div className="space-y-6">
          {mockOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order {order.id}</CardTitle>
                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="mr-2 h-4 w-4" />
                      Items
                    </div>
                    <p className="font-medium">{order.items}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="mr-2 h-4 w-4" />
                      Pickup
                    </div>
                    <p className="font-medium">{order.pickup}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="mr-2 h-4 w-4" />
                      Delivery
                    </div>
                    <p className="font-medium">{order.delivery}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Total
                    </div>
                    <p className="font-medium">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                {order.driver && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Driver: <span className="font-medium">{order.driver}</span>
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  {order.status === 'in_transit' && (
                    <Button variant="outline" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      Track Order
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Your delivery orders will appear here once you place them.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;