// FREE Push Notification Service using Web Push API
// ================================================

interface CustomPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

class PushNotificationService {
  private vapidPublicKey: string;
  private isSupported: boolean;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check if push notifications are supported
  isPushSupported(): boolean {
    return this.isSupported;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<CustomPushSubscription | null> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      if (!this.vapidPublicKey) {
        console.error('VAPID public key missing');
        return null;
      }

      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource
      });

      // Convert to our custom interface
      const customSubscription: CustomPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Save subscription to database
      await this.saveSubscription(customSubscription);

      return customSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          const customSubscription: CustomPushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
            }
          };
          await this.deleteSubscription(customSubscription);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Send notification to user
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (Notification.permission === 'granted') {
        const notificationOptions: NotificationOptions = {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          data: payload.data
        };

        const notification = new Notification(payload.title, notificationOptions);

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Save subscription to database
  private async saveSubscription(subscription: CustomPushSubscription): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        // Store subscription locally as fallback
        this.saveSubscriptionLocally(subscription);
        return;
      }

      const response = await fetch('/.netlify/functions/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save subscription:', response.status, errorText);
        // Store subscription locally as fallback
        this.saveSubscriptionLocally(subscription);
        return;
      }

      console.log('Push subscription saved successfully');
    } catch (error) {
      console.error('Error saving subscription:', error);
      // Store subscription locally as fallback
      this.saveSubscriptionLocally(subscription);
    }
  }

  // Save subscription locally as fallback
  private saveSubscriptionLocally(subscription: CustomPushSubscription): void {
    try {
      const existingSubscriptions = JSON.parse(localStorage.getItem('push_subscriptions') || '[]');
      const newSubscriptions = existingSubscriptions.filter((sub: any) => sub.endpoint !== subscription.endpoint);
      newSubscriptions.push({
        ...subscription,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('push_subscriptions', JSON.stringify(newSubscriptions));
      console.log('Push subscription saved locally as fallback');
    } catch (error) {
      console.error('Error saving subscription locally:', error);
    }
  }

  // Delete subscription from database
  private async deleteSubscription(subscription: CustomPushSubscription): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      if (!userId) {
        console.warn('No user ID available, deleting subscription locally only');
        this.deleteSubscriptionLocally(subscription);
        return;
      }

      const response = await fetch('/.netlify/functions/delete-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          userId: userId
        })
      });

      if (!response.ok) {
        console.error('Failed to delete subscription from server, deleting locally');
        this.deleteSubscriptionLocally(subscription);
        return;
      }

      console.log('Push subscription deleted successfully');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      this.deleteSubscriptionLocally(subscription);
    }
  }

  // Delete subscription locally
  private deleteSubscriptionLocally(subscription: CustomPushSubscription): void {
    try {
      const existingSubscriptions = JSON.parse(localStorage.getItem('push_subscriptions') || '[]');
      const filteredSubscriptions = existingSubscriptions.filter((sub: any) => sub.endpoint !== subscription.endpoint);
      localStorage.setItem('push_subscriptions', JSON.stringify(filteredSubscriptions));
      console.log('Push subscription deleted locally');
    } catch (error) {
      console.error('Error deleting subscription locally:', error);
    }
  }

  // Get current user ID
  private getCurrentUserId(): string | null {
    // Try to get user ID from various sources
    try {
      // First try to get from localStorage
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        return storedUserId;
      }

      // Try to get from mock profile
      const mockProfile = localStorage.getItem('mock_profile');
      if (mockProfile) {
        const profile = JSON.parse(mockProfile);
        if (profile.id) {
          return profile.id;
        }
      }

      // Try to get from auth context (if available)
      if (typeof window !== 'undefined' && (window as any).authUser) {
        return (window as any).authUser.id;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Check if user has an active push subscription
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;
      
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Restore subscription to database if browser has one but it's not saved
  async restoreSubscriptionIfNeeded(userId: string): Promise<boolean> {
    try {
      // First, ensure service worker is registered and ready
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        // Try to register service worker if not already registered
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
          console.log('Service worker registered for subscription restoration');
        } catch (swError) {
          console.error('Failed to register service worker for subscription restoration:', swError);
          return false;
        }
      } else {
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
      }

      if (!registration) return false;

      // Get subscription from push manager
      const browserSubscription = await registration.pushManager.getSubscription();
      if (!browserSubscription) {
        console.log('No browser subscription found to restore');
        return false;
      }

      // Convert to our custom format
      const customSubscription = {
        endpoint: browserSubscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(browserSubscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(browserSubscription.getKey('auth')!)
        }
      };

      // Check if subscription already exists in database to avoid duplicate saves
      // Note: We'll skip this check and let the Netlify function handle duplicates
      // to avoid import complexity in the service class

      // Save subscription directly to database using Netlify function
      const response = await fetch('/.netlify/functions/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: customSubscription,
          userId: userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Push subscription restored to database:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to restore subscription:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Error restoring subscription:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
