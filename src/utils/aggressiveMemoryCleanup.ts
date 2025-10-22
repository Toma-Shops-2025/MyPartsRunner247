// AGGRESSIVE MEMORY CLEANUP - Emergency Memory Management
// ======================================================

export class AggressiveMemoryCleanup {
  private static cleanupInterval: number | null = null;
  private static isRunning = false;

  // Start aggressive cleanup
  static startAggressiveCleanup(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🧹 Starting aggressive memory cleanup...');
    
    // Immediate cleanup
    this.performFullCleanup();
    
    // Set up periodic cleanup every 5 minutes (reduced frequency)
    this.cleanupInterval = window.setInterval(() => {
      this.performFullCleanup();
    }, 300000);
    
    // Cleanup on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performFullCleanup();
      }
    });
    
    // Cleanup on memory pressure
    if ('memory' in performance) {
      this.monitorMemoryPressure();
    }
  }

  // Stop aggressive cleanup
  static stopAggressiveCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Stopped aggressive memory cleanup');
  }

  // Perform full memory cleanup
  static performFullCleanup(): void {
    try {
      // 1. Clear localStorage of old data
      this.clearOldLocalStorage();
      
      // 2. Clear sessionStorage
      this.clearSessionStorage();
      
      // 3. Clear browser cache if possible
      this.clearBrowserCache();
      
      // 4. Force garbage collection
      this.forceGarbageCollection();
      
      // 5. Clear any pending timeouts/intervals
      this.clearPendingOperations();
      
      // 6. Optimize images
      this.optimizeImages();
      
      // Only log in development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('✅ Memory cleanup completed');
      }
    } catch (error) {
      console.error('❌ Memory cleanup failed:', error);
    }
  }

  // Clear old localStorage data
  private static clearOldLocalStorage(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('location_updates_') ||
        key.startsWith('order_tracking_') ||
        key.startsWith('analytics_') ||
        key.startsWith('performance_') ||
        key.startsWith('error_')
      )) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && now - data.timestamp > maxAge) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Remove corrupted data
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`🗑️ Removed ${keysToRemove.length} old localStorage entries`);
    }
  }

  // Clear sessionStorage
  private static clearSessionStorage(): void {
    const initialSize = sessionStorage.length;
    sessionStorage.clear();
    if (initialSize > 0) {
      console.log(`🗑️ Cleared ${initialSize} sessionStorage entries`);
    }
  }

  // Clear browser cache
  private static clearBrowserCache(): void {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        console.log(`🗑️ Cleared ${cacheNames.length} cache entries`);
      });
    }
  }

  // Force garbage collection
  private static forceGarbageCollection(): void {
    if ('gc' in window) {
      (window as any).gc();
      console.log('🗑️ Forced garbage collection');
    }
  }

  // Clear pending operations
  private static clearPendingOperations(): void {
    // Clear any high-numbered timeouts (likely old ones)
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  }

  // Optimize images
  private static optimizeImages(): void {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" to images that don't have it
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Remove srcset for very large images to save memory
      if (img.hasAttribute('srcset') && img.naturalWidth > 1920) {
        img.removeAttribute('srcset');
      }
    });
  }

  // Monitor memory pressure
  private static monitorMemoryPressure(): void {
    const memory = (performance as any).memory;
    if (memory) {
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 70) {
        console.warn('⚠️ High memory usage detected:', usagePercent.toFixed(1) + '%');
        this.performFullCleanup();
      }
    }
  }

  // Get memory usage info
  static getMemoryInfo(): { used: number; total: number; limit: number; usagePercent: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Emergency memory cleanup
  static emergencyCleanup(): void {
    console.log('🚨 Emergency memory cleanup triggered!');
    
    // Clear everything aggressively
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }
    
    // Force garbage collection multiple times
    if ('gc' in window) {
      for (let i = 0; i < 3; i++) {
        (window as any).gc();
      }
    }
    
    // Reload the page as last resort
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Auto-start aggressive cleanup on production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  // Start aggressive cleanup after 30 seconds
  setTimeout(() => {
    AggressiveMemoryCleanup.startAggressiveCleanup();
  }, 30000);
}
