// PWA SERVICE - Progressive Web App Management
// =============================================

class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', this.registration);
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.notifyUpdateAvailable();
              }
            });
          }
        });
        
        // Check for updates on focus
        window.addEventListener('focus', () => {
          if (this.registration) {
            this.registration.update();
          }
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async installPWA(): Promise<boolean> {
    if (!this.registration) return false;
    
    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }

  async uninstallPWA(): Promise<boolean> {
    if (!this.registration) return false;
    
    try {
      await this.registration.unregister();
      return true;
    } catch (error) {
      console.error('PWA uninstallation failed:', error);
      return false;
    }
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  isInstallable(): boolean {
    return !this.isInstalled() && 'serviceWorker' in navigator;
  }

  getInstallPrompt(): Promise<Event> {
    return new Promise((resolve) => {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        resolve(e);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    });
  }

  private notifyUpdateAvailable() {
    // You can customize this notification
    if (confirm('A new version of MY-RUNNER.COM is available. Would you like to update?')) {
      this.updateApp();
    }
  }

  private async updateApp() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Cache management
  async clearCache(): Promise<boolean> {
    if (!this.registration) return false;
    
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      return true;
    } catch (error) {
      console.error('Cache clearing failed:', error);
      return false;
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Cache size calculation failed:', error);
      return 0;
    }
  }

  // Offline detection
  isOnline(): boolean {
    return navigator.onLine;
  }

  // PWA features detection
  getSupportedFeatures(): string[] {
    const features: string[] = [];
    
    if ('serviceWorker' in navigator) features.push('Service Worker');
    if ('Notification' in window) features.push('Notifications');
    if ('caches' in window) features.push('Caching');
    if ('backgroundSync' in navigator.serviceWorker) features.push('Background Sync');
    if ('share' in navigator) features.push('Web Share');
    if ('getInstalledRelatedApps' in navigator) features.push('Related Apps');
    
    return features;
  }

  // Performance metrics
  async getPerformanceMetrics() {
    if (!('performance' in window)) return null;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
    };
  }
}

export const pwaService = new PWAService();
export default pwaService;
