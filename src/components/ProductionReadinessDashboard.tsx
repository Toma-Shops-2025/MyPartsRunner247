import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Zap, 
  Database, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Lock,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import SecurityAuditService from '@/services/SecurityAuditService';
import LoadTestingService from '@/services/LoadTestingService';
import BackupRecoveryService from '@/services/BackupRecoveryService';
import ProductionMonitoringService from '@/services/ProductionMonitoringService';

interface ProductionReadinessDashboardProps {
  className?: string;
}

const ProductionReadinessDashboard: React.FC<ProductionReadinessDashboardProps> = ({ className }) => {
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loadTestResults, setLoadTestResults] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [recoveryPlans, setRecoveryPlans] = useState<any[]>([]);
  const [systemOverview, setSystemOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [healthChecks, setHealthChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize services
  const securityService = SecurityAuditService.getInstance();
  const loadTestingService = LoadTestingService.getInstance();
  const backupService = BackupRecoveryService.getInstance();
  const monitoringService = ProductionMonitoringService.getInstance();

  useEffect(() => {
    loadAllData();
    startMonitoring();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load security data
      const securityData = await securityService.performSecurityAudit();
      const securityMetrics = await securityService.getSecurityMetrics();
      setVulnerabilities(securityData);
      setSecurityMetrics(securityMetrics);

      // Load backup data
      const backupStatus = backupService.getBackupStatus();
      const recoveryPlans = backupService.getAllRecoveryPlans();
      setBackupStatus(backupStatus);
      setRecoveryPlans(recoveryPlans);

      // Load monitoring data
      const systemOverview = monitoringService.getSystemOverview();
      setSystemOverview(systemOverview);
      setAlerts(systemOverview.alerts);
      setHealthChecks(systemOverview.healthChecks);

    } catch (error) {
      console.error('Error loading production readiness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    try {
      await monitoringService.startMonitoring();
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  const runLoadTests = async () => {
    setLoading(true);
    try {
      const results = await loadTestingService.runLoadTests();
      setLoadTestResults(results);
      
      const metrics = loadTestingService.analyzePerformance();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error running load tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const performFullBackup = async () => {
    setLoading(true);
    try {
      await backupService.performFullBackup();
      const status = backupService.getBackupStatus();
      setBackupStatus(status);
    } catch (error) {
      console.error('Error performing backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const performIncrementalBackup = async () => {
    setLoading(true);
    try {
      await backupService.performIncrementalBackup();
      const status = backupService.getBackupStatus();
      setBackupStatus(status);
    } catch (error) {
      console.error('Error performing incremental backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRecoveryPlan = async (planId: string) => {
    setLoading(true);
    try {
      await backupService.testRecoveryPlan(planId);
      const plans = backupService.getAllRecoveryPlans();
      setRecoveryPlans(plans);
    } catch (error) {
      console.error('Error testing recovery plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await monitoringService.acknowledgeAlert(alertId, 'admin');
      loadAllData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await monitoringService.resolveAlert(alertId);
      loadAllData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-red-400';
      case 'warning': return 'bg-yellow-400';
      case 'info': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'unhealthy': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Production Readiness Dashboard</h1>
          <p className="text-gray-300">Comprehensive monitoring and management for nationwide launch</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Security Score */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Shield className="w-4 h-4" />
                Security Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {securityMetrics?.securityScore || 0}/100
              </div>
              <div className="text-xs text-gray-400">
                {vulnerabilities.length} vulnerabilities found
              </div>
            </CardContent>
          </Card>

          {/* Performance Score */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Zap className="w-4 h-4" />
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {performanceMetrics?.scalabilityScore || 0}/100
              </div>
              <div className="text-xs text-gray-400">
                Load testing results
              </div>
            </CardContent>
          </Card>

          {/* Backup Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <HardDrive className="w-4 h-4" />
                Backup Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {backupStatus?.completed || 0}
              </div>
              <div className="text-xs text-gray-400">
                {backupStatus?.failed || 0} failed
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Activity className="w-4 h-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {healthChecks.filter(h => h.status === 'healthy').length}/{healthChecks.length}
              </div>
              <div className="text-xs text-gray-400">
                Services healthy
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-teal-600">
              Security
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-teal-600">
              Performance
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-teal-600">
              Backup & Recovery
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-teal-600">
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Alerts */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.filter(a => a.severity === 'critical' && !a.resolved).length > 0 ? (
                    <div className="space-y-2">
                      {alerts.filter(a => a.severity === 'critical' && !a.resolved).slice(0, 5).map(alert => (
                        <Alert key={alert.id} className="bg-red-900/20 border-red-600/30">
                          <AlertDescription className="text-red-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold">{alert.title}</div>
                                <div className="text-sm">{alert.message}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                                className="ml-2"
                              >
                                Resolve
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      No critical alerts
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Health Checks */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {healthChecks.map(healthCheck => (
                      <div key={healthCheck.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(healthCheck.status)}
                          <span className="text-sm">{healthCheck.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${getStatusColor(healthCheck.status)}`}>
                            {healthCheck.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {healthCheck.responseTime}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Metrics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Security Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {securityMetrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Security Score</span>
                        <span className="font-bold">{securityMetrics.securityScore}/100</span>
                      </div>
                      <Progress value={securityMetrics.securityScore} className="h-2" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-red-400">Critical: {securityMetrics.criticalCount}</div>
                          <div className="text-yellow-400">High: {securityMetrics.highCount}</div>
                        </div>
                        <div>
                          <div className="text-blue-400">Medium: {securityMetrics.mediumCount}</div>
                          <div className="text-gray-400">Low: {securityMetrics.lowCount}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vulnerabilities */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-400" />
                    Security Vulnerabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vulnerabilities.slice(0, 5).map(vulnerability => (
                      <div key={vulnerability.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div>
                          <div className="font-semibold text-sm">{vulnerability.title}</div>
                          <div className="text-xs text-gray-400">{vulnerability.category}</div>
                        </div>
                        <Badge className={getSeverityColor(vulnerability.type)}>
                          {vulnerability.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Performance Testing</h3>
              <Button onClick={runLoadTests} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Load Tests
              </Button>
            </div>

            {loadTestResults.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Load Test Results */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-400" />
                      Load Test Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loadTestResults.map(result => (
                        <div key={result.id} className="p-3 bg-gray-700 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{result.testName}</span>
                            <Badge className={result.errorRate > 5 ? 'bg-red-500' : 'bg-green-500'}>
                              {result.errorRate.toFixed(1)}% errors
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Users: {result.concurrentUsers}</div>
                            <div>RPS: {result.requestsPerSecond}</div>
                            <div>Response: {result.averageResponseTime}ms</div>
                            <div>Duration: {result.duration}s</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceMetrics && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Scalability Score</span>
                          <span className="font-bold">{performanceMetrics.scalabilityScore}/100</span>
                        </div>
                        <Progress value={performanceMetrics.scalabilityScore} className="h-2" />
                        <div className="space-y-2 text-sm">
                          <div>Response Time: {performanceMetrics.responseTime}ms</div>
                          <div>Throughput: {performanceMetrics.throughput} req/s</div>
                          <div>Error Rate: {performanceMetrics.errorRate}%</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Backup & Recovery Tab */}
          <TabsContent value="backup" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Backup & Recovery</h3>
              <div className="flex gap-2">
                <Button onClick={performIncrementalBackup} disabled={loading}>
                  Incremental Backup
                </Button>
                <Button onClick={performFullBackup} disabled={loading}>
                  Full Backup
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backup Status */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Backup Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {backupStatus && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{backupStatus.completed}</div>
                          <div className="text-sm text-gray-400">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{backupStatus.failed}</div>
                          <div className="text-sm text-gray-400">Failed</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recovery Plans */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-green-400" />
                    Recovery Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recoveryPlans.map(plan => (
                      <div key={plan.id} className="p-3 bg-gray-700 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{plan.name}</span>
                          <Button
                            size="sm"
                            onClick={() => testRecoveryPlan(plan.id)}
                            disabled={loading}
                          >
                            Test
                          </Button>
                        </div>
                        <div className="text-sm text-gray-400">
                          RTO: {plan.rto}min | RPO: {plan.rpo}min
                        </div>
                        <div className="text-xs text-gray-500">
                          Priority: {plan.priority}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Metrics */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    System Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {systemOverview?.metrics && (
                    <div className="space-y-3">
                      {systemOverview.metrics.slice(0, 5).map(metric => (
                        <div key={metric.id} className="flex items-center justify-between">
                          <span className="text-sm">{metric.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{metric.value}{metric.unit}</span>
                            <Badge className={getSeverityColor(metric.status)}>
                              {metric.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alerts.filter(a => !a.resolved).slice(0, 5).map(alert => (
                      <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div>
                          <div className="font-semibold text-sm">{alert.title}</div>
                          <div className="text-xs text-gray-400">{alert.message}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Ack
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionReadinessDashboard;
