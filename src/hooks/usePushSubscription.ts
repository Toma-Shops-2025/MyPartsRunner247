import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import pushNotificationService from '@/services/PushNotificationService';

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
        
        // Always try to restore subscription on login (even if check fails initially)
        // This ensures the subscription is saved to DB after login
        const restoreResult = await pushNotificationService.restoreSubscriptionIfNeeded(user.id);
        
        // Re-check after restoration attempt
        const finalCheck = await pushNotificationService.hasActiveSubscription();
        setHasSubscription(finalCheck || hasBrowserSub);
        
        if (restoreResult) {
          console.log('✅ Push subscription restored successfully');
        } else if (hasBrowserSub) {
          console.log('⚠️ Browser has subscription but restoration may have failed');
        }
      } catch (error) {
        console.error('Error checking/restoring push subscription:', error);
        // Still check if browser has subscription even if restore fails
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

