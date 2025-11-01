import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import pushNotificationService from '@/services/PushNotificationService';
import { supabase } from '@/lib/supabase';

/**
 * Hook to check push notification subscription status
 * Push subscriptions persist in the browser automatically - they don't need to be re-enabled on login
 */
export function usePushSubscription() {
  const { user } = useAuth();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user?.id || !pushNotificationService.isPushSupported()) {
      setHasSubscription(false);
      setIsChecking(false);
      return;
    }

    // Check if user has an active subscription and restore if needed
    const checkAndRestoreSubscription = async () => {
      try {
        setIsChecking(true);
        
        // Wait a bit for service worker to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if browser has an active subscription
        const hasBrowserSub = await pushNotificationService.hasActiveSubscription();
        
        if (!hasBrowserSub) {
          // No browser subscription, definitely no subscription
          setHasSubscription(false);
          setIsChecking(false);
          return;
        }
        
        // Browser has subscription - check if it's in the database
        const { data: dbSubscriptions, error } = await supabase
          .from('push_subscriptions')
          .select('endpoint')
          .eq('user_id', user.id)
          .limit(1);
        
        const hasDbSubscription = !error && dbSubscriptions && dbSubscriptions.length > 0;
        
        // If browser has subscription but DB doesn't, restore it
        if (hasBrowserSub && !hasDbSubscription) {
          console.log('📱 Browser has subscription but not in DB, restoring...');
          const restoreResult = await pushNotificationService.restoreSubscriptionIfNeeded(user.id);
          
          if (restoreResult) {
            console.log('✅ Push subscription restored to database successfully');
            setHasSubscription(true);
          } else {
            console.warn('⚠️ Failed to restore subscription to database');
            // Only show as subscribed if it's in the database
            setHasSubscription(false);
          }
        } else if (hasBrowserSub && hasDbSubscription) {
          // Both browser and DB have subscription - fully subscribed
          console.log('✅ Push subscription active (browser + database)');
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      } catch (error) {
        console.error('Error checking/restoring push subscription:', error);
        // On error, fallback to browser check only
        try {
          const hasSub = await pushNotificationService.hasActiveSubscription();
          setHasSubscription(hasSub);
        } catch (checkError) {
          setHasSubscription(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Run immediately on mount/login
    checkAndRestoreSubscription();

    // Also run after a short delay to catch service worker registration
    const delayedCheck = setTimeout(checkAndRestoreSubscription, 2000);

    // Re-check periodically
    const interval = setInterval(checkAndRestoreSubscription, 60000); // Check every minute
    
    return () => {
      clearTimeout(delayedCheck);
      clearInterval(interval);
    };
  }, [user?.id]);

  return { hasSubscription, isChecking };
}

