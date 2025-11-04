import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BusinessMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeDrivers: number;
  activeCustomers: number;
  averageOrderValue: number;
  completionRate: number;
  customerSatisfaction: number;
  driverEarnings: number;
  platformFee: number;
  refunds: number;
  disputes: number;
  fraudRate: number;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
  drivers: number;
  customers: number;
}

const BusinessOperationsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchBusinessMetrics();
    fetchTimeSeriesData();
    const interval = setInterval(fetchBusinessMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBusinessMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
      }

      // Fetch profiles data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const activeDrivers = profiles?.filter(p => p.user_type === 'driver').length || 0;
      const activeCustomers = profiles?.filter(p => p.user_type === 'customer').length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate completion rate
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Calculate driver earnings (70% of net after Stripe fees)
      // Estimate Stripe fee at ~3% of revenue
      const estimatedStripeFee = totalRevenue * 0.03;
      const netAfterStripeFee = totalRevenue - estimatedStripeFee;
      const driverEarnings = netAfterStripeFee * 0.70;
      const platformFee = netAfterStripeFee * 0.30;

      // Mock data for other metrics
      const customerSatisfaction = 4.2; // Average rating
      const refunds = totalRevenue * 0.02; // 2% refund rate
      const disputes = Math.floor(totalOrders * 0.01); // 1% dispute rate
      const fraudRate = 0.5; // 0.5% fraud rate

      const businessMetrics: BusinessMetrics = {
        totalRevenue,
        totalOrders,
        activeDrivers,
        activeCustomers,
        averageOrderValue,
        completionRate,
        customerSatisfaction,
        driverEarnings,
        platformFee,
        refunds,
        disputes,
        fraudRate
      };

      setMetrics(businessMetrics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      // Generate mock time series data for the last 30 days
      const data: TimeSeriesData[] = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.random() * 1000 + 500,
          orders: Math.floor(Math.random() * 50) + 10,
          drivers: Math.floor(Math.random() * 20) + 5,
          customers: Math.floor(Math.random() * 100) + 20
        });
      }
      
      setTimeSeriesData(data);
    } catch (error) {
      console.error('Error fetching time series data:', error);
    }
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (value < threshold) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (value: number, good: number, warning: number) => {
    if (value >= good) return 'text-green-400';
    if (value >= warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading && !metrics) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
          <p className="text-gray-300 mt-2">Loading business metrics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Operations Dashboard</h1>
          <p className="text-gray-300">Real-time business metrics and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchBusinessMetrics}
            disabled={loading}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <span className="text-sm text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${metrics?.totalRevenue.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(metrics?.totalRevenue || 0, 1000)}
              <span className="text-sm text-gray-400">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Orders</p>
                <p className="text-2xl font-bold text-white">{metrics?.totalOrders || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(metrics?.totalOrders || 0, 50)}
              <span className="text-sm text-gray-400">+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Active Drivers</p>
                <p className="text-2xl font-bold text-white">{metrics?.activeDrivers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(metrics?.activeDrivers || 0, 10)}
              <span className="text-sm text-gray-400">+15% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Active Customers</p>
                <p className="text-2xl font-bold text-white">{metrics?.activeCustomers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-teal-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {getTrendIcon(metrics?.activeCustomers || 0, 50)}
              <span className="text-sm text-gray-400">+25% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Average Order Value</span>
              <span className={`font-semibold ${getStatusColor(metrics?.averageOrderValue || 0, 25, 15)}`}>
                ${metrics?.averageOrderValue.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Completion Rate</span>
              <span className={`font-semibold ${getStatusColor(metrics?.completionRate || 0, 90, 75)}`}>
                {metrics?.completionRate.toFixed(1) || '0.0'}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Customer Satisfaction</span>
              <span className={`font-semibold ${getStatusColor(metrics?.customerSatisfaction || 0, 4.0, 3.5)}`}>
                {metrics?.customerSatisfaction.toFixed(1) || '0.0'}/5.0
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Fraud Rate</span>
              <span className={`font-semibold ${getStatusColor(1 - (metrics?.fraudRate || 0), 0.95, 0.90)}`}>
                {metrics?.fraudRate.toFixed(2) || '0.00'}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PieChart className="w-5 h-5" />
              Financial Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Driver Earnings</span>
              <span className="font-semibold text-green-400">
                ${metrics?.driverEarnings.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Platform Fee</span>
              <span className="font-semibold text-blue-400">
                ${metrics?.platformFee.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Refunds</span>
              <span className="font-semibold text-red-400">
                ${metrics?.refunds.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Active Disputes</span>
              <span className="font-semibold text-yellow-400">
                {metrics?.disputes || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5" />
            Revenue & Orders Trend (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-1">
            {timeSeriesData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div 
                  className="bg-teal-500 w-2 rounded-t"
                  style={{ height: `${(data.revenue / 1500) * 200}px` }}
                  title={`${data.date}: $${data.revenue.toFixed(2)}`}
                />
                <div 
                  className="bg-blue-500 w-2 rounded-t"
                  style={{ height: `${(data.orders / 60) * 200}px` }}
                  title={`${data.date}: ${data.orders} orders`}
                />
                {index % 5 === 0 && (
                  <span className="text-xs text-gray-400 transform -rotate-45">
                    {new Date(data.date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded"></div>
              <span className="text-sm text-gray-300">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-300">Orders</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Notifications */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5" />
            Business Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics && metrics.completionRate < 90 && (
              <Alert className="bg-yellow-900/20 border-yellow-600/30">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-yellow-300">
                  Completion rate is below target (90%). Consider driver training or process improvements.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics && metrics.fraudRate > 1 && (
              <Alert className="bg-red-900/20 border-red-600/30">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-300">
                  Fraud rate is above acceptable levels. Review fraud detection systems.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics && metrics.disputes > 5 && (
              <Alert className="bg-orange-900/20 border-orange-600/30">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-orange-300">
                  High number of active disputes. Review dispute resolution process.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics && metrics.customerSatisfaction < 4.0 && (
              <Alert className="bg-blue-900/20 border-blue-600/30">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-blue-300">
                  Customer satisfaction is below target. Consider service improvements.
                </AlertDescription>
              </Alert>
            )}
            
            {(!metrics || (metrics.completionRate >= 90 && metrics.fraudRate <= 1 && metrics.disputes <= 5 && metrics.customerSatisfaction >= 4.0)) && (
              <Alert className="bg-green-900/20 border-green-600/30">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription className="text-green-300">
                  All business metrics are within acceptable ranges. Great job!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOperationsDashboard;
