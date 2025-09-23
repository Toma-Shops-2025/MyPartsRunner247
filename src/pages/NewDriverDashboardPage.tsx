import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, MapPin, Clock, DollarSign, Package, CheckCircle, AlertCircle } from 'lucide-react';

const NewDriverDashboardPage: React.FC = () => {
  const { user, profile, loading } = useAuth();

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

  // Mock data - in real app, this would come from API
  const driverStats = {
    totalEarnings: 245.50,
    completedDeliveries: 12,
    activeDeliveries: 1,
    rating: 4.8
  };

  const availableOrders = [
    {
      id: 1,
      pickup: "123 Main St, Downtown",
      delivery: "456 Oak Ave, Uptown",
      item: "Documents",
      distance: "2.3 miles",
      fee: "$12.50",
      time: "15 min ago"
    },
    {
      id: 2,
      pickup: "789 Pine St, Midtown",
      delivery: "321 Elm St, Suburbs",
      item: "Package",
      distance: "5.1 miles",
      fee: "$18.75",
      time: "8 min ago"
    }
  ];

  const activeOrders = [
    {
      id: 3,
      pickup: "555 Broadway, City Center",
      delivery: "777 Park Ave, Residential",
      item: "Food delivery",
      status: "Picked up",
      customer: "John D.",
      phone: "(555) 123-4567"
    }
  ];

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
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">${driverStats.totalEarnings}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">{driverStats.completedDeliveries}</p>
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

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white">{driverStats.rating}</p>
                </div>
                <Car className="w-8 h-8 text-teal-400" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                          <span>From: {order.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {order.delivery}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Item: {order.item}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Customer: {order.customer}</span>
                          <span>•</span>
                          <span>{order.phone}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                          Call Customer
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No active deliveries</p>
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
                    <div key={order.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-white">Order #{order.id}</span>
                        <span className="text-xs text-gray-400">{order.time}</span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>From: {order.pickup}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>To: {order.delivery}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>Item: {order.item}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance: {order.distance}</span>
                          <span className="font-bold text-green-400">Fee: {order.fee}</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700">
                        Accept Order
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No available orders</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewDriverDashboardPage;
