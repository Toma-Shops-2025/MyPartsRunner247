// ANALYTICS DASHBOARD - Business Intelligence & Performance
// ========================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Clock, 
  MapPin,
  Star,
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalDrivers: number;
  totalCustomers: number;
  averageOrderValue: number;
  completionRate: number;
  customerSatisfaction: number;
  revenueGrowth: number;
  orderGrowth: number;
  driverEarnings: number;
  platformFee: number;
  recentOrders: any[];
  topDrivers: any[];
  popularRoutes: any[];
  hourlyStats: any[];
  dailyStats: any[];
  weeklyStats: any[];
}

const AnalyticsDashboard: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalDrivers: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    completionRate: 0,
    customerSatisfaction: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    driverEarnings: 0,
    platformFee: 0,
    recentOrders: [],
    topDrivers: [],
    popularRoutes: [],
    hourlyStats: [],
    dailyStats: [],
    weeklyStats: []
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (user && profile?.user_type === 'admin') {
      fetchAnalyticsData();
    }
  }, [user, profile, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setDataLoading(true);
      
      // Calculate date range based on selected period
      const now = new Date();
      const startDate = new Date();
      switch (selectedPeriod) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Fetch users data
      const { data: users } = await supabase
        .from('profiles')
        .select('*');

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(order => order.status === 'delivered').length || 0;
      const totalDrivers = users?.filter(user => user.user_type === 'driver').length || 0;
      const totalCustomers = users?.filter(user => user.user_type === 'customer').length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const driverEarnings = totalRevenue * 0.7; // 70% to drivers
      const platformFee = totalRevenue * 0.3; // 30% to platform

      // Calculate growth (simplified)
      const revenueGrowth = 15.2; // Mock data - would calculate from previous period
      const orderGrowth = 23.8; // Mock data

      // Recent orders
      const recentOrders = orders?.slice(0, 10) || [];

      // Top drivers (mock data)
      const topDrivers = [
        { name: 'John Smith', orders: 45, earnings: 1250.00, rating: 4.9 },
        { name: 'Ryan Johnson', orders: 38, earnings: 980.00, rating: 4.8 },
        { name: 'Mike Wilson', orders: 32, earnings: 875.00, rating: 4.7 }
      ];

      // Popular routes (mock data)
      const popularRoutes = [
        { route: 'Downtown → Airport', orders: 25, revenue: 1250.00 },
        { route: 'Mall → University', orders: 18, revenue: 720.00 },
        { route: 'Hospital → Suburbs', orders: 15, revenue: 600.00 }
      ];

      // Hourly stats (mock data)
      const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        orders: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 500) + 100
      }));

      // Daily stats (mock data)
      const dailyStats = Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        orders: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 2000) + 500
      }));

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalDrivers,
        totalCustomers,
        averageOrderValue,
        completionRate,
        customerSatisfaction: 4.6, // Mock data
        revenueGrowth,
        orderGrowth,
        driverEarnings,
        platformFee,
        recentOrders,
        topDrivers,
        popularRoutes,
        hourlyStats,
        dailyStats,
        weeklyStats: [] // Would implement weekly stats
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const exportData = () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${analyticsData.totalRevenue.toFixed(2)}`],
      ['Total Orders', analyticsData.totalOrders.toString()],
      ['Total Drivers', analyticsData.totalDrivers.toString()],
      ['Total Customers', analyticsData.totalCustomers.toString()],
      ['Average Order Value', `$${analyticsData.averageOrderValue.toFixed(2)}`],
      ['Completion Rate', `${analyticsData.completionRate.toFixed(1)}%`],
      ['Driver Earnings', `$${analyticsData.driverEarnings.toFixed(2)}`],
      ['Platform Fee', `$${analyticsData.platformFee.toFixed(2)}`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (profile?.user_type !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-300">Business intelligence and performance insights</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-teal-600">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="drivers" className="data-[state=active]:bg-teal-600">
              Drivers
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-teal-600">
              Customers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">${analyticsData.totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-green-400">+{analyticsData.revenueGrowth}%</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.totalOrders}</p>
                      <p className="text-xs text-green-400">+{analyticsData.orderGrowth}%</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Drivers</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.totalDrivers}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Customers</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.totalCustomers}</p>
                    </div>
                    <Users className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Order Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-white font-semibold">{analyticsData.completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Order Value</span>
                      <span className="text-white font-semibold">${analyticsData.averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer Rating</span>
                      <span className="text-white font-semibold flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {analyticsData.customerSatisfaction}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Driver Earnings (70%)</span>
                      <span className="text-green-400 font-semibold">${analyticsData.driverEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee (30%)</span>
                      <span className="text-blue-400 font-semibold">${analyticsData.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analyticsData.recentOrders.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-400">Order #{order.id?.slice(0, 8)}</span>
                        <span className="text-white">${order.total}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <BarChart3 className="w-12 h-12" />
                    <span className="ml-2">Chart visualization would go here</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Popular Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.popularRoutes.map((route, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{route.route}</p>
                          <p className="text-gray-400 text-sm">{route.orders} orders</p>
                        </div>
                        <span className="text-green-400 font-semibold">${route.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Top Performing Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topDrivers.map((driver, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-gray-400 text-sm">{driver.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">${driver.earnings.toFixed(2)}</p>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-gray-400 text-sm">{driver.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Customer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{analyticsData.totalCustomers}</p>
                    <p className="text-gray-400">Total Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{analyticsData.customerSatisfaction}</p>
                    <p className="text-gray-400">Avg Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{analyticsData.averageOrderValue.toFixed(2)}</p>
                    <p className="text-gray-400">Avg Order Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
