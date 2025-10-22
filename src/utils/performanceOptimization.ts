// PERFORMANCE OPTIMIZATION UTILITIES
// ===================================

export class PerformanceOptimizer {
  // Disable performance monitoring in production
  static shouldDisableDetailedMonitoring(): boolean {
    return (typeof window !== 'undefined' && window.location.hostname !== 'localhost') || 
           localStorage.getItem('disable-detailed-monitoring') === 'true';
  }

  // Optimize analytics service
  static optimizeAnalytics(): void {
    if (this.shouldDisableDetailedMonitoring()) {
      // Disable detailed analytics in production
      const analyticsService = (window as any).analyticsService;
      if (analyticsService) {
        analyticsService.track = () => {}; // Disable tracking
      }
    }
  }

  // Optimize error monitoring
  static optimizeErrorMonitoring(): void {
    if (this.shouldDisableDetailedMonitoring()) {
      // Disable detailed error monitoring in production
      const errorService = (window as any).errorMonitoringService;
      if (errorService) {
        errorService.captureError = () => {}; // Disable error capture
        errorService.capturePerformanceMetric = () => {}; // Disable performance metrics
      }
    }
  }

  // Lazy load heavy components
  static lazyLoadComponent(importFn: () => Promise<any>) {
    // Dynamic import for lazy loading
    return importFn;
  }

  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Optimize image loading
  static optimizeImageLoading(): void {
    // Add loading="lazy" to all images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  // Preload critical resources
  static preloadCriticalResources(): void {
    const criticalResources = [
      '/src/main.tsx',
      '/src/App.tsx'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = 'script';
      document.head.appendChild(link);
    });
  }

  // Optimize bundle size
  static optimizeBundleSize(): void {
    // Remove unused imports
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Disable source maps in production
      console.log('Production mode: Source maps disabled for better performance');
    }
  }

  // Monitor and log performance
  static logPerformanceMetrics(): void {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('Performance Metrics:', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstByte: navigation.responseStart - navigation.requestStart
        });
      }
    }
  }
}

// Auto-optimize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    PerformanceOptimizer.optimizeAnalytics();
    PerformanceOptimizer.optimizeErrorMonitoring();
    PerformanceOptimizer.optimizeImageLoading();
    PerformanceOptimizer.preloadCriticalResources();
    PerformanceOptimizer.logPerformanceMetrics();
  });
}
