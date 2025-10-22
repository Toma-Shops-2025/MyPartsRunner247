// ERROR MONITORING SERVICE - FREE Crash Tracking & Performance
// ============================================================

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'performance' | 'user' | 'system';
  context?: any;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  url: string;
  userId?: string;
  sessionId: string;
  category: 'navigation' | 'resource' | 'paint' | 'custom';
}

class ErrorMonitoringService {
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxQueueSize: number = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  public initialize() {
    this.initializeErrorHandlers();
    this.initializePerformanceMonitoring();
    this.initializeNetworkMonitoring();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        severity: 'high',
        category: 'javascript'
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        severity: 'high',
        category: 'javascript'
      });
    });

    // Console error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureError({
        message: args.join(' '),
        url: window.location.href,
        severity: 'medium',
        category: 'javascript'
      });
      originalConsoleError.apply(console, args);
    };
  }

  private initializePerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.capturePerformanceMetrics();
      }, 1000);
    });

    // Monitor navigation timing
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.capturePerformanceMetric({
            name: entry.name,
            value: entry.duration,
            category: this.getPerformanceCategory(entry),
            url: window.location.href
          });
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private initializeNetworkMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueues();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.capturePerformanceMetric({
          name: `fetch_${args[0]}`,
          value: endTime - startTime,
          category: 'resource',
          url: window.location.href
        });

        if (!response.ok) {
          this.captureError({
            message: `Network Error: ${response.status} ${response.statusText}`,
            url: args[0] as string,
            severity: 'medium',
            category: 'network'
          });
        }

        return response;
      } catch (error) {
        this.captureError({
          message: `Fetch Error: ${error.message}`,
          url: args[0] as string,
          severity: 'high',
          category: 'network'
        });
        throw error;
      }
    };
  }

  private getPerformanceCategory(entry: PerformanceEntry): 'navigation' | 'resource' | 'paint' | 'custom' {
    if (entry.entryType === 'navigation') return 'navigation';
    if (entry.entryType === 'resource') return 'resource';
    if (entry.entryType === 'paint') return 'paint';
    return 'custom';
  }

  public captureError(errorData: Partial<ErrorReport>) {
    const error: ErrorReport = {
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || window.location.href,
      lineNumber: errorData.lineNumber,
      columnNumber: errorData.columnNumber,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      severity: errorData.severity || 'medium',
      category: errorData.category || 'javascript',
      context: errorData.context
    };

    this.errorQueue.push(error);
    this.logError(error);
    this.flushQueues();
  }

  public capturePerformanceMetric(metricData: Partial<PerformanceMetric>) {
    const metric: PerformanceMetric = {
      name: metricData.name || 'unknown_metric',
      value: metricData.value || 0,
      timestamp: new Date().toISOString(),
      url: metricData.url || window.location.href,
      userId: this.userId,
      sessionId: this.sessionId,
      category: metricData.category || 'custom'
    };

    this.performanceQueue.push(metric);
    this.flushQueues();
  }

  private capturePerformanceMetrics() {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      // Page load metrics
      this.capturePerformanceMetric({
        name: 'page_load_time',
        value: navigation.loadEventEnd - navigation.loadEventStart,
        category: 'navigation'
      });

      this.capturePerformanceMetric({
        name: 'dom_content_loaded',
        value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        category: 'navigation'
      });

      this.capturePerformanceMetric({
        name: 'first_byte',
        value: navigation.responseStart - navigation.requestStart,
        category: 'navigation'
      });
    }

    // Paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      this.capturePerformanceMetric({
        name: entry.name,
        value: entry.startTime,
        category: 'paint'
      });
    });
  }

  private logError(error: ErrorReport) {
    console.group(`🚨 Error: ${error.severity.toUpperCase()}`);
    console.error('Message:', error.message);
    console.error('URL:', error.url);
    console.error('Line:', error.lineNumber);
    console.error('Stack:', error.stack);
    console.error('Context:', error.context);
    console.groupEnd();
  }

  private async flushQueues() {
    if (!this.isOnline || (this.errorQueue.length === 0 && this.performanceQueue.length === 0)) {
      return;
    }

    try {
      // Send errors
      if (this.errorQueue.length > 0) {
        await this.sendToEndpoint('/api/errors', this.errorQueue);
        this.errorQueue = [];
      }

      // Send performance metrics
      if (this.performanceQueue.length > 0) {
        await this.sendToEndpoint('/api/performance', this.performanceQueue);
        this.performanceQueue = [];
      }
    } catch (error) {
      console.warn('Failed to send monitoring data:', error);
    }
  }

  private async sendToEndpoint(endpoint: string, data: any[]) {
    if (data.length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: new Date().toISOString(),
          data: data
        })
      });
    } catch (error) {
      console.warn(`Failed to send data to ${endpoint}:`, error);
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public captureUserAction(action: string, context?: any) {
    this.captureError({
      message: `User Action: ${action}`,
      severity: 'low',
      category: 'user',
      context
    });
  }

  public captureCustomMetric(name: string, value: number, category: 'custom' = 'custom') {
    this.capturePerformanceMetric({
      name,
      value,
      category
    });
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getErrorCount(): number {
    return this.errorQueue.length;
  }

  public getPerformanceMetricsCount(): number {
    return this.performanceQueue.length;
  }

  // Manual error reporting
  public reportError(error: Error, context?: any) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      severity: 'high',
      category: 'javascript',
      context
    });
  }

  // Performance timing
  public startTiming(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.capturePerformanceMetric({
        name,
        value: endTime - startTime,
        category: 'custom'
      });
    };
  }
}

export const errorMonitoringService = new ErrorMonitoringService();
export default errorMonitoringService;
