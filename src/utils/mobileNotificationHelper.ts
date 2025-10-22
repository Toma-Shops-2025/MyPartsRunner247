// MOBILE NOTIFICATION HELPER - Mobile-Specific Notification Handling
// ==================================================================

export class MobileNotificationHelper {
  // Check if we're on a mobile device
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if we're on iOS
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Check if we're on Android
  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // Get mobile-specific notification instructions
  static getMobileInstructions(): string {
    if (this.isIOS()) {
      return `📱 iOS Instructions:
1. Go to Settings → Safari → Notifications
2. Enable notifications for MyPartsRunner
3. Make sure "Allow Notifications" is ON
4. Refresh the page and try again`;
    } else if (this.isAndroid()) {
      return `📱 Android Instructions:
1. Open Chrome/Safari settings
2. Go to Site Settings → Notifications
3. Allow notifications for MyPartsRunner
4. Check device notification settings
5. Refresh the page and try again`;
    } else {
      return `📱 Mobile Instructions:
1. Check browser notification settings
2. Allow notifications for this site
3. Check device notification permissions
4. Refresh the page and try again`;
    }
  }

  // Test notification with mobile-specific handling
  static async testMobileNotification(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      // Request permission if not already granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission denied');
        }
      } else if (Notification.permission === 'denied') {
        throw new Error('Permission denied');
      }

      // Try service worker approach first
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: {
              title: 'MyPartsRunner Test',
              body: 'This is a test notification! 🚀',
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: 'mobile-test-notification'
            }
          });
          return true;
        }
      } catch (swError) {
        console.warn('Service worker notification failed:', swError);
      }

      // Fallback to direct notification
      const notification = new Notification('MyPartsRunner Test', {
        body: 'This is a test notification! 🚀',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'mobile-test-notification',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Mobile notification test failed:', error);
      return false;
    }
  }

  // Get detailed error message for mobile
  static getMobileErrorMessage(error: any): string {
    const baseMessage = 'Mobile notification test failed.';
    
    if (error.message.includes('Permission denied')) {
      return `${baseMessage}\n\nPlease enable notifications:\n\n${this.getMobileInstructions()}`;
    } else if (error.message.includes('not supported')) {
      return `${baseMessage}\n\nYour browser doesn't support notifications. Please try a different browser.`;
    } else {
      return `${baseMessage}\n\nPlease try:\n\n${this.getMobileInstructions()}`;
    }
  }

  // Check if browser supports all notification features
  static checkNotificationSupport(): { supported: boolean; features: string[] } {
    const features: string[] = [];
    
    if ('Notification' in window) features.push('Basic Notifications');
    if ('serviceWorker' in navigator) features.push('Service Worker');
    if ('PushManager' in window) features.push('Push Manager');
    if ('navigator' in window && 'vibrate' in navigator) features.push('Vibration');
    
    return {
      supported: features.length > 0,
      features
    };
  }
}
