// ANALYTICS SERVICE - Business Intelligence & Performance Tracking
// ================================================================

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

interface BusinessMetrics {
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
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxQueueSize: number = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  public initialize() {
    this.initializeAnalytics();
  }

  private generateSessionId(): string {
    return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeAnalytics() {
    // Track page views
    this.trackPageView();
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Track performance metrics
    this.trackPerformanceMetrics();
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private trackPageView() {
    this.track('page_view', {
      page: window.location.pathname,
      referrer: document.referrer,
      title: document.title
    });
  }

  private trackUserInteractions() {
    // Track button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        this.track('button_click', {
          buttonText: target.textContent?.trim(),
          buttonId: target.id,
          buttonClass: target.className
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.track('form_submit', {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method
      });
    });

    // Track link clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      if (link) {
        this.track('link_click', {
          linkText: link.textContent?.trim(),
          linkHref: link.href,
          linkTarget: link.target
        });
      }
    });
  }

  private trackPerformanceMetrics() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPerformanceTiming();
      }, 1000);
    });

    // Track navigation timing
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.track('performance_metric', {
            name: entry.name,
            duration: entry.duration,
            entryType: entry.entryType,
            startTime: entry.startTime
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

  private trackPerformanceTiming() {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.track('page_performance', {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      });
    }
  }

  public track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.eventQueue.push(analyticsEvent);
    console.log('📊 Analytics Event:', analyticsEvent);

    // Flush events if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flushEvents();
    } else if (this.isOnline) {
      // Flush events after a short delay
      setTimeout(() => this.flushEvents(), 1000);
    }
  }

  private async flushEvents() {
    if (!this.isOnline || this.eventQueue.length === 0) return;

    try {
      await this.sendToEndpoint('/api/analytics', this.eventQueue);
      this.eventQueue = [];
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  private async sendToEndpoint(endpoint: string, events: AnalyticsEvent[]) {
    if (events.length === 0) return;

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
          events: events
        })
      });
    } catch (error) {
      console.warn(`Failed to send analytics to ${endpoint}:`, error);
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  // Business-specific tracking methods
  public trackOrderPlaced(orderData: any) {
    this.track('order_placed', {
      orderId: orderData.id,
      total: orderData.total,
      items: orderData.items,
      customerId: orderData.customer_id,
      pickupAddress: orderData.pickup_address,
      deliveryAddress: orderData.delivery_address
    });
  }

  public trackOrderCompleted(orderData: any) {
    this.track('order_completed', {
      orderId: orderData.id,
      total: orderData.total,
      driverId: orderData.driver_id,
      completionTime: orderData.completion_time,
      rating: orderData.rating
    });
  }

  public trackDriverSignup(driverData: any) {
    this.track('driver_signup', {
      driverId: driverData.id,
      location: driverData.location,
      vehicleType: driverData.vehicle_type,
      experience: driverData.experience
    });
  }

  public trackCustomerSignup(customerData: any) {
    this.track('customer_signup', {
      customerId: customerData.id,
      location: customerData.location,
      referralSource: customerData.referral_source
    });
  }

  public trackPaymentProcessed(paymentData: any) {
    this.track('payment_processed', {
      orderId: paymentData.order_id,
      amount: paymentData.amount,
      method: paymentData.method,
      success: paymentData.success
    });
  }

  public trackDriverEarnings(earningsData: any) {
    this.track('driver_earnings', {
      driverId: earningsData.driver_id,
      amount: earningsData.amount,
      period: earningsData.period,
      orders: earningsData.orders
    });
  }

  // Performance tracking
  public trackCustomMetric(name: string, value: number, properties: Record<string, any> = {}) {
    this.track('custom_metric', {
      metricName: name,
      metricValue: value,
      ...properties
    });
  }

  // User behavior tracking
  public trackUserJourney(step: string, properties: Record<string, any> = {}) {
    this.track('user_journey', {
      step,
      ...properties
    });
  }

  // Error tracking
  public trackError(error: Error, context: Record<string, any> = {}) {
    this.track('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    });
  }

  // Business metrics calculation
  public async calculateBusinessMetrics(): Promise<BusinessMetrics> {
    // This would typically fetch data from your backend
    // For now, return mock data
    return {
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
      platformFee: 0
    };
  }

  // Export analytics data
  public exportData(format: 'csv' | 'json' = 'json') {
    const data = {
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.eventQueue,
      timestamp: new Date().toISOString()
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvContent = this.convertToCSV(data);
      this.downloadFile(csvContent, 'analytics.csv', 'text/csv');
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(data, null, 2);
      this.downloadFile(jsonContent, 'analytics.json', 'application/json');
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion
    const headers = ['Event', 'Properties', 'Timestamp', 'URL'];
    const rows = data.events.map((event: AnalyticsEvent) => [
      event.event,
      JSON.stringify(event.properties),
      event.timestamp,
      event.url
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
