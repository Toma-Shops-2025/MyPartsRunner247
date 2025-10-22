import { supabase } from '@/lib/supabase';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface Alert {
  id: string;
  type: 'system' | 'performance' | 'security' | 'business';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata: Record<string, any>;
}

interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  uptime: number; // percentage
  errorRate: number; // percentage
  dependencies: string[];
  endpoint?: string;
}

interface PerformanceData {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  databaseConnections: number;
  activeUsers: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTime: number;
}

class ProductionMonitoringService {
  private static instance: ProductionMonitoringService;
  private metrics: SystemMetric[] = [];
  private alerts: Alert[] = [];
  private healthChecks: HealthCheck[] = [];
  private performanceData: PerformanceData[] = [];
  private isMonitoring = false;
  private monitoringInterval?: number;

  static getInstance(): ProductionMonitoringService {
    if (!ProductionMonitoringService.instance) {
      ProductionMonitoringService.instance = new ProductionMonitoringService();
    }
    return ProductionMonitoringService.instance;
  }

  /**
   * Start production monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('📊 Monitoring already running');
      return;
    }

    console.log('📊 Starting production monitoring...');
    this.isMonitoring = true;

    // Initialize health checks
    await this.initializeHealthChecks();

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.performHealthChecks();
      await this.analyzePerformance();
      await this.checkAlerts();
    }, 30000); // Every 30 seconds

    console.log('✅ Production monitoring started');
  }

  /**
   * Stop production monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('📊 Production monitoring stopped');
  }

  /**
   * Initialize health checks
   */
  private async initializeHealthChecks(): Promise<void> {
    this.healthChecks = [
      {
        id: 'database_health',
        name: 'Database Connectivity',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 100,
        errorRate: 0,
        dependencies: ['supabase'],
        endpoint: 'database'
      },
      {
        id: 'api_health',
        name: 'API Endpoints',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 100,
        errorRate: 0,
        dependencies: ['api_server'],
        endpoint: 'api'
      },
      {
        id: 'auth_health',
        name: 'Authentication Service',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 100,
        errorRate: 0,
        dependencies: ['supabase_auth'],
        endpoint: 'auth'
      },
      {
        id: 'payment_health',
        name: 'Payment Processing',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 100,
        errorRate: 0,
        dependencies: ['stripe_api'],
        endpoint: 'payment'
      },
      {
        id: 'notification_health',
        name: 'Notification Service',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 100,
        errorRate: 0,
        dependencies: ['push_notifications'],
        endpoint: 'notifications'
      }
    ];
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      // Simulate system metrics collection
      const newMetrics: SystemMetric[] = [
        {
          id: `cpu_${Date.now()}`,
          name: 'CPU Usage',
          value: this.getSimulatedCPUUsage(),
          unit: '%',
          threshold: { warning: 70, critical: 90 },
          status: 'normal',
          timestamp,
          trend: 'stable',
          description: 'CPU utilization percentage'
        },
        {
          id: `memory_${Date.now()}`,
          name: 'Memory Usage',
          value: this.getSimulatedMemoryUsage(),
          unit: '%',
          threshold: { warning: 80, critical: 95 },
          status: 'normal',
          timestamp,
          trend: 'stable',
          description: 'Memory utilization percentage'
        },
        {
          id: `disk_${Date.now()}`,
          name: 'Disk Usage',
          value: this.getSimulatedDiskUsage(),
          unit: '%',
          threshold: { warning: 85, critical: 95 },
          status: 'normal',
          timestamp,
          trend: 'up',
          description: 'Disk space utilization percentage'
        },
        {
          id: `network_${Date.now()}`,
          name: 'Network Latency',
          value: this.getSimulatedNetworkLatency(),
          unit: 'ms',
          threshold: { warning: 200, critical: 500 },
          status: 'normal',
          timestamp,
          trend: 'stable',
          description: 'Network response time'
        },
        {
          id: `database_${Date.now()}`,
          name: 'Database Connections',
          value: this.getSimulatedDatabaseConnections(),
          unit: 'connections',
          threshold: { warning: 80, critical: 100 },
          status: 'normal',
          timestamp,
          trend: 'stable',
          description: 'Active database connections'
        },
        {
          id: `users_${Date.now()}`,
          name: 'Active Users',
          value: this.getSimulatedActiveUsers(),
          unit: 'users',
          threshold: { warning: 1000, critical: 2000 },
          status: 'normal',
          timestamp,
          trend: 'up',
          description: 'Currently active users'
        },
        {
          id: `requests_${Date.now()}`,
          name: 'Requests Per Second',
          value: this.getSimulatedRequestsPerSecond(),
          unit: 'req/s',
          threshold: { warning: 100, critical: 200 },
          status: 'normal',
          timestamp,
          trend: 'up',
          description: 'API requests per second'
        },
        {
          id: `errors_${Date.now()}`,
          name: 'Error Rate',
          value: this.getSimulatedErrorRate(),
          unit: '%',
          threshold: { warning: 5, critical: 10 },
          status: 'normal',
          timestamp,
          trend: 'stable',
          description: 'Application error rate'
        }
      ];

      // Update metric status based on thresholds
      newMetrics.forEach(metric => {
        if (metric.value >= metric.threshold.critical) {
          metric.status = 'critical';
        } else if (metric.value >= metric.threshold.warning) {
          metric.status = 'warning';
        }
      });

      this.metrics.push(...newMetrics);

      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Store performance data
      const performanceData: PerformanceData = {
        timestamp,
        cpuUsage: newMetrics.find(m => m.name === 'CPU Usage')?.value || 0,
        memoryUsage: newMetrics.find(m => m.name === 'Memory Usage')?.value || 0,
        diskUsage: newMetrics.find(m => m.name === 'Disk Usage')?.value || 0,
        networkLatency: newMetrics.find(m => m.name === 'Network Latency')?.value || 0,
        databaseConnections: newMetrics.find(m => m.name === 'Database Connections')?.value || 0,
        activeUsers: newMetrics.find(m => m.name === 'Active Users')?.value || 0,
        requestsPerSecond: newMetrics.find(m => m.name === 'Requests Per Second')?.value || 0,
        errorRate: newMetrics.find(m => m.name === 'Error Rate')?.value || 0,
        responseTime: this.getSimulatedResponseTime()
      };

      this.performanceData.push(performanceData);

      // Keep only last 100 performance data points
      if (this.performanceData.length > 100) {
        this.performanceData = this.performanceData.slice(-100);
      }

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    for (const healthCheck of this.healthChecks) {
      try {
        const startTime = Date.now();
        
        // Simulate health check based on endpoint
        let isHealthy = true;
        let responseTime = 0;
        let errorRate = 0;

        switch (healthCheck.endpoint) {
          case 'database':
            isHealthy = await this.checkDatabaseHealth();
            responseTime = Date.now() - startTime;
            break;
          case 'api':
            isHealthy = await this.checkAPIHealth();
            responseTime = Date.now() - startTime;
            break;
          case 'auth':
            isHealthy = await this.checkAuthHealth();
            responseTime = Date.now() - startTime;
            break;
          case 'payment':
            isHealthy = await this.checkPaymentHealth();
            responseTime = Date.now() - startTime;
            break;
          case 'notifications':
            isHealthy = await this.checkNotificationHealth();
            responseTime = Date.now() - startTime;
            break;
        }

        // Update health check status
        healthCheck.responseTime = responseTime;
        healthCheck.lastCheck = new Date().toISOString();
        healthCheck.errorRate = isHealthy ? 0 : 100;
        healthCheck.status = isHealthy ? 'healthy' : 'unhealthy';

        // Update uptime calculation
        const totalChecks = 100; // Simulated total checks
        const successfulChecks = isHealthy ? totalChecks : totalChecks - 1;
        healthCheck.uptime = (successfulChecks / totalChecks) * 100;

      } catch (error) {
        console.error(`Health check failed for ${healthCheck.name}:`, error);
        healthCheck.status = 'unhealthy';
        healthCheck.errorRate = 100;
      }
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<boolean> {
    try {
      // Simulate API health check
      return Math.random() > 0.1; // 90% success rate
    } catch (error) {
      return false;
    }
  }

  /**
   * Check authentication health
   */
  private async checkAuthHealth(): Promise<boolean> {
    try {
      // Simulate auth health check
      return Math.random() > 0.05; // 95% success rate
    } catch (error) {
      return false;
    }
  }

  /**
   * Check payment health
   */
  private async checkPaymentHealth(): Promise<boolean> {
    try {
      // Simulate payment health check
      return Math.random() > 0.02; // 98% success rate
    } catch (error) {
      return false;
    }
  }

  /**
   * Check notification health
   */
  private async checkNotificationHealth(): Promise<boolean> {
    try {
      // Simulate notification health check
      return Math.random() > 0.03; // 97% success rate
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze performance trends
   */
  private async analyzePerformance(): Promise<void> {
    if (this.performanceData.length < 2) return;

    const recent = this.performanceData.slice(-10);
    const previous = this.performanceData.slice(-20, -10);

    if (previous.length === 0) return;

    // Calculate performance trends
    const cpuTrend = this.calculateTrend(recent.map(p => p.cpuUsage), previous.map(p => p.cpuUsage));
    const memoryTrend = this.calculateTrend(recent.map(p => p.memoryUsage), previous.map(p => p.memoryUsage));
    const responseTimeTrend = this.calculateTrend(recent.map(p => p.responseTime), previous.map(p => p.responseTime));

    // Generate alerts for concerning trends
    if (cpuTrend > 20) {
      await this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'CPU Usage Increasing',
        message: `CPU usage has increased by ${cpuTrend.toFixed(1)}% in the last 10 minutes`,
        source: 'performance_analysis',
        metadata: { trend: cpuTrend, metric: 'cpu' }
      });
    }

    if (memoryTrend > 15) {
      await this.createAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Memory Usage Increasing',
        message: `Memory usage has increased by ${memoryTrend.toFixed(1)}% in the last 10 minutes`,
        source: 'performance_analysis',
        metadata: { trend: memoryTrend, metric: 'memory' }
      });
    }

    if (responseTimeTrend > 50) {
      await this.createAlert({
        type: 'performance',
        severity: 'error',
        title: 'Response Time Degrading',
        message: `Response time has increased by ${responseTimeTrend.toFixed(1)}% in the last 10 minutes`,
        source: 'performance_analysis',
        metadata: { trend: responseTimeTrend, metric: 'response_time' }
      });
    }
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts(): Promise<void> {
    const recentMetrics = this.metrics.slice(-10);

    for (const metric of recentMetrics) {
      if (metric.status === 'critical') {
        await this.createAlert({
          type: 'system',
          severity: 'critical',
          title: `${metric.name} Critical`,
          message: `${metric.name} is at ${metric.value}${metric.unit}, exceeding critical threshold of ${metric.threshold.critical}${metric.unit}`,
          source: 'metric_monitoring',
          metadata: { metric: metric.name, value: metric.value, threshold: metric.threshold.critical }
        });
      } else if (metric.status === 'warning') {
        await this.createAlert({
          type: 'system',
          severity: 'warning',
          title: `${metric.name} Warning`,
          message: `${metric.name} is at ${metric.value}${metric.unit}, exceeding warning threshold of ${metric.threshold.warning}${metric.unit}`,
          source: 'metric_monitoring',
          metadata: { metric: metric.name, value: metric.value, threshold: metric.threshold.warning }
        });
      }
    }

    // Check for unhealthy health checks
    for (const healthCheck of this.healthChecks) {
      if (healthCheck.status === 'unhealthy') {
        await this.createAlert({
          type: 'system',
          severity: 'error',
          title: `${healthCheck.name} Unhealthy`,
          message: `${healthCheck.name} is currently unhealthy with ${healthCheck.errorRate}% error rate`,
          source: 'health_check',
          metadata: { healthCheck: healthCheck.name, errorRate: healthCheck.errorRate }
        });
      }
    }
  }

  /**
   * Create alert
   */
  private async createAlert(alertData: Partial<Alert>): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertData.type || 'system',
      severity: alertData.severity || 'info',
      title: alertData.title || 'System Alert',
      message: alertData.message || 'A system alert has been triggered',
      source: alertData.source || 'monitoring_system',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      metadata: alertData.metadata || {}
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log alert to database
    try {
      await supabase
        .from('system_alerts')
        .insert([{
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.metadata,
          created_at: alert.timestamp
        }]);
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }

  /**
   * Calculate trend between two datasets
   */
  private calculateTrend(current: number[], previous: number[]): number {
    if (current.length === 0 || previous.length === 0) return 0;

    const currentAvg = current.reduce((sum, val) => sum + val, 0) / current.length;
    const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;

    if (previousAvg === 0) return 0;
    return ((currentAvg - previousAvg) / previousAvg) * 100;
  }

  /**
   * Simulated metric generators
   */
  private getSimulatedCPUUsage(): number {
    return Math.round(Math.random() * 100);
  }

  private getSimulatedMemoryUsage(): number {
    return Math.round(Math.random() * 100);
  }

  private getSimulatedDiskUsage(): number {
    return Math.round(30 + Math.random() * 40); // 30-70%
  }

  private getSimulatedNetworkLatency(): number {
    return Math.round(50 + Math.random() * 100); // 50-150ms
  }

  private getSimulatedDatabaseConnections(): number {
    return Math.round(10 + Math.random() * 50); // 10-60 connections
  }

  private getSimulatedActiveUsers(): number {
    return Math.round(100 + Math.random() * 500); // 100-600 users
  }

  private getSimulatedRequestsPerSecond(): number {
    return Math.round(10 + Math.random() * 50); // 10-60 req/s
  }

  private getSimulatedErrorRate(): number {
    return Math.round(Math.random() * 5); // 0-5%
  }

  private getSimulatedResponseTime(): number {
    return Math.round(100 + Math.random() * 200); // 100-300ms
  }

  /**
   * Get system overview
   */
  getSystemOverview(): {
    metrics: SystemMetric[];
    alerts: Alert[];
    healthChecks: HealthCheck[];
    performanceData: PerformanceData[];
    isMonitoring: boolean;
  } {
    return {
      metrics: this.metrics.slice(-50), // Last 50 metrics
      alerts: this.alerts.slice(-20), // Last 20 alerts
      healthChecks: this.healthChecks,
      performanceData: this.performanceData.slice(-20), // Last 20 data points
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();

    return true;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();

    return true;
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get critical alerts
   */
  getCriticalAlerts(): Alert[] {
    return this.alerts.filter(a => a.severity === 'critical' && !a.resolved);
  }
}

export default ProductionMonitoringService;
