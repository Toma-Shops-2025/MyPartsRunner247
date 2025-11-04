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
   * RETRIES multiple times to ensure success (like DoorDash/other platforms)
   */
  async autoEnablePushNotifications(userId: string, retryCount: number = 0): Promise<boolean> {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 3000; // 3 seconds between retries

    try {
      // Check if push is supported
      if (!pushNotificationService.isPushSupported()) {
        console.log('⚠️ Push notifications not supported on this device');
        return false;
      }

      // Check current permission status
      const currentPermission = Notification.permission;

      // If permission is denied, we can't enable it automatically
      if (currentPermission === 'denied') {
        console.warn('⚠️ Push notification permission is denied - user must enable manually');
        return false;
      }

      // Check if user already has a subscription in both browser and DB
      const hasBrowserSub = await pushNotificationService.hasActiveSubscription();
      
      // Check if subscription exists in database
      const { data: dbSubscriptions, error: dbError } = await supabase
        .from('push_subscriptions')
        .select('endpoint, user_id')
        .eq('user_id', userId)
        .limit(1);

      const hasDbSub = dbSubscriptions && dbSubscriptions.length > 0;

      // Only log detailed subscription check if not already subscribed (to reduce spam)
      if (!hasBrowserSub || !hasDbSub) {
        console.log(`🔍 Subscription check for user ${userId}:`);
        console.log(`   Browser subscription: ${hasBrowserSub ? '✅' : '❌'}`);
        console.log(`   Database subscription: ${hasDbSub ? '✅' : '❌'}`);
        if (dbError) {
          console.error('   Database check error:', dbError);
        }
      }

      // If already subscribed in both browser and DB, we're done
      if (hasBrowserSub && hasDbSub) {
        // Only log once per user to avoid spam
        if (!this.subscribedUsers.has(userId)) {
          console.log('✅ User already has push notifications enabled in both browser and database');
        }
        this.subscribedUsers.add(userId);
        return true;
      }
      
      // If browser has subscription but DB doesn't, we need to save it
      if (hasBrowserSub && !hasDbSub) {
        console.log('⚠️ Browser has subscription but database does not - saving to database...');
        // This will be handled below by restoreSubscriptionIfNeeded
      }

      console.log(`🔔 Auto-enabling push notifications (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      console.log(`   Browser subscription: ${hasBrowserSub ? '✅' : '❌'}`);
      console.log(`   Database subscription: ${hasDbSub ? '✅' : '❌'}`);
      console.log(`   Permission: ${currentPermission}`);

      // Wait for service worker to be ready (critical for mobile!)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('✅ Service worker ready');
        } catch (swError) {
          console.warn('⚠️ Service worker not ready yet, waiting...');
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
              this.autoEnablePushNotifications(userId, retryCount + 1);
            }, RETRY_DELAY);
            return false;
          }
        }
      }

      // If permission is default (not asked yet), request it
      if (currentPermission === 'default') {
        console.log('🔔 Requesting push notification permission...');
        const permission = await pushNotificationService.requestPermission();
        
        if (permission !== 'granted') {
          console.warn(`⚠️ Push notification permission not granted (${permission})`);
          // Retry if user might accept later (sometimes it takes a moment)
          if (retryCount < MAX_RETRIES && permission === 'default') {
            setTimeout(() => {
              this.autoEnablePushNotifications(userId, retryCount + 1);
            }, RETRY_DELAY);
          }
          return false;
        }
        console.log('✅ Permission granted!');
      }

      // If browser doesn't have subscription, create one
      if (!hasBrowserSub) {
        console.log('📱 Creating browser push subscription...');
        const subscription = await pushNotificationService.subscribe();
        
        if (!subscription) {
          console.error('❌ Failed to create push subscription');
          // Retry if we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...`);
            setTimeout(() => {
              this.autoEnablePushNotifications(userId, retryCount + 1);
            }, RETRY_DELAY);
            return false;
          }
          return false;
        }
        console.log('✅ Browser subscription created');
      }

      // Ensure subscription is saved to database
      console.log('💾 Saving subscription to database...');
      const restoreResult = await pushNotificationService.restoreSubscriptionIfNeeded(userId);
      
      // Check if restore was successful (restoreResult returns boolean)
      const saveSuccess = restoreResult === true;
      
      if (saveSuccess) {
        console.log('✅ Subscription saved to database successfully');
        // Give database a moment to propagate (especially for Supabase replication)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify it's actually in database now (with longer timeout for replication)
        const { data: verifySubs, error: verifyError } = await supabase
          .from('push_subscriptions')
          .select('endpoint, user_id')
          .eq('user_id', userId)
          .limit(1);
        
        if (verifyError) {
          console.error('⚠️ Error verifying subscription in database:', verifyError);
          // Continue anyway - the save said it succeeded
        } else if (verifySubs && verifySubs.length > 0) {
          console.log('✅ Subscription verified in database');
        } else {
          console.warn('⚠️ Subscription save reported success but not found in database yet (replication delay)');
          // This is likely a replication delay - trust the save result and continue
          // The subscription will be found on next check
        }
        
        console.log('✅✅✅ Push notifications automatically enabled for user');
        this.subscribedUsers.add(userId);
        return true;
      } else {
        // Save failed - retry if we haven't exceeded max retries
        console.warn('⚠️ Subscription save failed, retrying...');
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            this.autoEnablePushNotifications(userId, retryCount + 1);
          }, RETRY_DELAY);
          return false;
        } else {
          console.error('❌ Failed to save subscription after all retries');
          return false;
        }
      }

      // Final retry if still not working
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Final retry in ${RETRY_DELAY / 1000} seconds...`);
        setTimeout(() => {
          this.autoEnablePushNotifications(userId, retryCount + 1);
        }, RETRY_DELAY);
        return false;
      }

      console.error('❌ Failed to enable push notifications after all retries');
      return false;
    } catch (error) {
      console.error('❌ Error auto-enabling push notifications:', error);
      
      // Retry on error if we haven't exceeded max
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying after error in ${RETRY_DELAY / 1000} seconds...`);
        setTimeout(() => {
          this.autoEnablePushNotifications(userId, retryCount + 1);
        }, RETRY_DELAY);
      }
      
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
