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
        applicationServerKey
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
        console.warn('No user ID available, skipping push subscription save');
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
      console.warn('Error getting user ID:', error);
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
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
