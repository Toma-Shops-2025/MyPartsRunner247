// Auto Push Notification Service
// Automatically enables push notifications for all users on login
// ================================================

import pushNotificationService from './PushNotificationService';
import { supabase } from '@/lib/supabase';

class AutoPushNotificationService {
  private static instance: AutoPushNotificationService;
  private subscribedUsers: Set<string> = new Set();

  public static getInstance(): AutoPushNotificationService {
    if (!AutoPushNotificationService.instance) {
      AutoPushNotificationService.instance = new AutoPushNotificationService();
    }
    return AutoPushNotificationService.instance;
  }

  /**
   * Automatically enable push notifications for a user
   * Runs silently in the background, similar to other platforms
   */
  async autoEnablePushNotifications(userId: string): Promise<boolean> {
    // Prevent duplicate attempts
    if (this.subscribedUsers.has(userId)) {
      return true;
    }

    try {
      // Check if push is supported
      if (!pushNotificationService.isPushSupported()) {
        console.log('Push notifications not supported on this device');
        return false;
      }

      // Check current permission status
      const currentPermission = Notification.permission;

      // If permission is denied, we can't enable it automatically
      if (currentPermission === 'denied') {
        console.warn('Push notification permission is denied');
        return false;
      }

      // Check if user already has a subscription
      const hasBrowserSub = await pushNotificationService.hasActiveSubscription();
      
      // Check if subscription exists in database
      const { data: dbSubscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint')
        .eq('user_id', userId)
        .limit(1);

      const hasDbSub = dbSubscriptions && dbSubscriptions.length > 0;

      // If already subscribed in both browser and DB, we're done
      if (hasBrowserSub && hasDbSub) {
        console.log('✅ User already has push notifications enabled');
        this.subscribedUsers.add(userId);
        return true;
      }

      // If permission is default (not asked yet), request it
      if (currentPermission === 'default') {
        console.log('🔔 Requesting push notification permission...');
        const permission = await pushNotificationService.requestPermission();
        
        if (permission !== 'granted') {
          console.warn('Push notification permission not granted');
          return false;
        }
      }

      // If browser doesn't have subscription, create one
      if (!hasBrowserSub) {
        console.log('📱 Subscribing to push notifications...');
        const subscription = await pushNotificationService.subscribe();
        
        if (!subscription) {
          console.error('Failed to create push subscription');
          return false;
        }
      }

      // Ensure subscription is saved to database
      const restoreResult = await pushNotificationService.restoreSubscriptionIfNeeded(userId);
      
      if (restoreResult || hasDbSub) {
        console.log('✅ Push notifications automatically enabled for user');
        this.subscribedUsers.add(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error auto-enabling push notifications:', error);
      return false;
    }
  }

  /**
   * Clear subscription tracking (e.g., on logout)
   */
  clearUser(userId: string): void {
    this.subscribedUsers.delete(userId);
  }

  /**
   * Check if user has active subscription (browser + database)
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const hasBrowserSub = await pushNotificationService.hasActiveSubscription();
      
      if (!hasBrowserSub) {
        return false;
      }

      const { data: dbSubscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint')
        .eq('user_id', userId)
        .limit(1);

      return !error && dbSubscriptions && dbSubscriptions.length > 0;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }
}

export const autoPushNotificationService = AutoPushNotificationService.getInstance();
export default autoPushNotificationService;
