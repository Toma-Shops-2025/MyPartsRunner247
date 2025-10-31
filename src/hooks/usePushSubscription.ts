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

    // Check if user has an active subscription
    const checkSubscription = async () => {
      try {
        setIsChecking(true);
        const hasSub = await pushNotificationService.hasActiveSubscription();
        setHasSubscription(hasSub);
        
        // If browser has subscription, try to restore it to DB if needed
        if (hasSub) {
          await pushNotificationService.restoreSubscriptionIfNeeded(user.id);
        }
      } catch (error) {
        console.error('Error checking push subscription:', error);
        setHasSubscription(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkSubscription();

    // Re-check when permission changes
    const interval = setInterval(checkSubscription, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user?.id]);

  return { hasSubscription, isChecking };
}

