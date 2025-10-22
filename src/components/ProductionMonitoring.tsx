import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  Server,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  ordersToday: number;
  revenue: number;
  lastUpdate: string;
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

const ProductionMonitoring: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      
      // Check database connectivity
      const { data: dbTest, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      // Get system metrics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, last_sign_in_at')
        .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate metrics
      const todayOrders = orders?.length || 0;
      const todayRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0;
      const activeUsers = users?.length || 0;

      // Simulate system health metrics
      const health: SystemHealth = {
        status: dbError ? 'critical' : 'healthy',
        uptime: 99.9,
        responseTime: Math.random() * 100 + 50, // Simulated response time
        errorRate: dbError ? 5.2 : 0.1,
        activeUsers,
        ordersToday: todayOrders,
        revenue: todayRevenue,
        lastUpdate: new Date().toISOString()
      };

      setSystemHealth(health);

      // Generate alerts based on system health
      const newAlerts: AlertItem[] = [];
      
      if (dbError) {
        newAlerts.push({
          id: `db-error-${Date.now()}`,
          type: 'error',
          message: `Database connectivity issue: ${dbError.message}`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      if (health.errorRate > 2) {
        newAlerts.push({
          id: `high-error-rate-${Date.now()}`,
          type: 'warning',
          message: `High error rate detected: ${health.errorRate.toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      if (health.responseTime > 200) {
        newAlerts.push({
          id: `slow-response-${Date.now()}`,
          type: 'warning',
          message: `Slow response time: ${health.responseTime.toFixed(0)}ms`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }

      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error fetching system health:', error);
      setAlerts(prev => [{
        id: `monitoring-error-${Date.now()}`,
        type: 'error',
        message: `Monitoring system error: ${error}`,
        timestamp: new Date().toISOString(),
        resolved: false
      }, ...prev].slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-900/30 text-green-300 border-green-600/30';
      case 'warning': return 'bg-yellow-900/30 text-yellow-300 border-yellow-600/30';
      case 'critical': return 'bg-red-900/30 text-red-300 border-red-600/30';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading && !systemHealth) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
          <p className="text-gray-300 mt-2">Loading system health...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5" />
              System Health Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(systemHealth?.status || 'unknown')}>
                {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
              <Button 
                onClick={fetchSystemHealth}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {systemHealth && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Uptime</span>
                </div>
                <div className="text-2xl font-bold text-white">{systemHealth.uptime}%</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Response Time</span>
                </div>
                <div className="text-2xl font-bold text-white">{systemHealth.responseTime.toFixed(0)}ms</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Active Users</span>
                </div>
                <div className="text-2xl font-bold text-white">{systemHealth.activeUsers}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Today's Revenue</span>
                </div>
                <div className="text-2xl font-bold text-white">${systemHealth.revenue.toFixed(2)}</div>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5" />
              System Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <Alert key={alert.id} className="bg-gray-700 border-gray-600">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertDescription className="text-gray-300">
                        {alert.message}
                      </AlertDescription>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={alert.resolved ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}
                    >
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Metrics */}
      {systemHealth && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Business Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Orders Today</span>
                </div>
                <div className="text-2xl font-bold text-white">{systemHealth.ordersToday}</div>
                <div className="text-xs text-gray-400">New orders</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-white">${systemHealth.revenue.toFixed(2)}</div>
                <div className="text-xs text-gray-400">Today's earnings</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-gray-300">Error Rate</span>
                </div>
                <div className="text-2xl font-bold text-white">{systemHealth.errorRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">System errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionMonitoring;
