// MEMORY OPTIMIZATION UTILITIES
// =============================

export class MemoryOptimizer {
  private static intervals: Set<NodeJS.Timeout> = new Set();
  private static timeouts: Set<NodeJS.Timeout> = new Set();
  private static eventListeners: Map<string, EventListener[]> = new Map();

  // Track intervals for cleanup
  static trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    this.intervals.add(interval);
    return interval;
  }

  // Track timeouts for cleanup
  static trackTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
    this.timeouts.add(timeout);
    return timeout;
  }

  // Track event listeners for cleanup
  static trackEventListener(event: string, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  // Clear all tracked intervals
  static clearAllIntervals(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  // Clear all tracked timeouts
  static clearAllTimeouts(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  // Remove all tracked event listeners
  static removeAllEventListeners(): void {
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        window.removeEventListener(event, listener);
      });
    });
    this.eventListeners.clear();
  }

  // Clean up all tracked resources
  static cleanup(): void {
    this.clearAllIntervals();
    this.clearAllTimeouts();
    this.removeAllEventListeners();
  }

  // Monitor memory usage
  static getMemoryUsage(): { used: number; total: number; limit: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Check if memory usage is high
  static isMemoryHigh(): boolean {
    const memory = this.getMemoryUsage();
    if (!memory) return false;
    
    const usagePercent = (memory.used / memory.limit) * 100;
    return usagePercent > 80; // Alert if using more than 80% of available memory
  }

  // Force garbage collection (if available)
  static forceGC(): void {
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // Clear localStorage of old data
  static clearOldLocalStorage(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('location_updates_') || key.startsWith('order_tracking_'))) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && now - data.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Optimize performance monitoring
  static optimizePerformanceMonitoring(): void {
    // Reduce monitoring frequency in production
    if (process.env.NODE_ENV === 'production') {
      // Disable detailed performance monitoring in production
      localStorage.setItem('disable-detailed-monitoring', 'true');
    }
  }
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  MemoryOptimizer.cleanup();
});

// Periodic memory cleanup
setInterval(() => {
  if (MemoryOptimizer.isMemoryHigh()) {
    console.warn('High memory usage detected, cleaning up...');
    MemoryOptimizer.clearOldLocalStorage();
    MemoryOptimizer.forceGC();
  }
}, 60000); // Check every minute
