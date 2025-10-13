import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface AdminStats {
  totalOrders: number;
  activeDrivers: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customerid: string;
  driver_id: string;
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  total_deliveries: number;
  rating: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalOrders: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch drivers (from profiles where user_type = 'driver')
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'driver');

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const activeDrivers = driversData?.filter(d => d.status === 'active').length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalOrders,
        activeDrivers,
        totalRevenue,
        pendingOrders
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const updateDriverStatus = async (driverId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', driverId);

      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {drivers.length} total drivers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Platform fee included
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Need driver assignment
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">#{order.id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-lg font-bold">${order.total.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Management & Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{driver.full_name}</div>
                      <div className="text-sm text-gray-600">{driver.email}</div>
                      <div className="text-sm">
                        {driver.total_deliveries || 0} deliveries • {driver.rating || 0} ⭐
                      </div>
                      {driver.status === 'pending' && (
                        <div className="text-xs text-orange-600 font-medium">
                          ⏳ Awaiting Approval
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        driver.status === 'active' ? 'bg-green-100 text-green-800' :
                        driver.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        driver.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {driver.status?.toUpperCase() || 'PENDING'}
                      </Badge>
                      
                      {driver.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateDriverStatus(driver.id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✓ Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateDriverStatus(driver.id, 'rejected')}
                          >
                            ✗ Reject
                          </Button>
                        </>
                      )}
                      
                      {driver.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateDriverStatus(driver.id, 'inactive')}
                        >
                          Deactivate
                        </Button>
                      )}
                      
                      {driver.status === 'inactive' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateDriverStatus(driver.id, 'active')}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {drivers.filter(d => d.status === 'pending').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending driver applications
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {((stats.totalOrders / 30) || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Orders per day</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${((stats.totalRevenue / stats.totalOrders) || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Average order value</div>
                  </div>
                </div>
                
                <div className="text-center text-gray-600">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Detailed analytics charts would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;