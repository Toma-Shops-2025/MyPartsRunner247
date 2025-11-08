import { useEffect, useState, useCallback } from 'react';
import { subscribeToPush, unsubscribeFromPush, isPushSupported, getExistingSubscription } from '@/services/pushNotificationService';
import { useAuth } from '@/hooks/useAuth';

export const usePushNotifications = () => {
  const { profile, user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(isPushSupported());

    if (!isPushSupported()) {
      return;
    }

    getExistingSubscription().then((subscription) => {
      setHasSubscription(!!subscription);
    });
  }, []);

  const enablePush = useCallback(async () => {
    if (!isPushSupported()) {
      setError('Push notifications are not supported on this device.');
      return;
    }

    if (!user) {
      setError('You must be logged in to enable notifications.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const subscription = await subscribeToPush(profile);
      setPermission(Notification.permission);
      setHasSubscription(!!subscription);
    } catch (err: any) {
      console.error('Failed to enable push notifications:', err);
      setError(err?.message || 'Failed to enable push notifications');
    } finally {
      setIsProcessing(false);
    }
  }, [profile, user]);

  const disablePush = useCallback(async () => {
    try {
      setIsProcessing(true);
      await unsubscribeFromPush(profile);
      setHasSubscription(false);
    } catch (err: any) {
      console.error('Failed to disable push notifications:', err);
      setError(err?.message || 'Failed to disable push notifications');
    } finally {
      setIsProcessing(false);
    }
  }, [profile]);

  return {
    isSupported,
    permission,
    hasSubscription,
    isProcessing,
    error,
    enablePush,
    disablePush
  };
};
