import { supabase } from '@/lib/supabase';
import { Profile } from '@/hooks/useAuth';

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const getExistingSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

export const subscribeToPush = async (profile: Profile | null) => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  if (!vapidPublicKey) {
    throw new Error('Missing VITE_VAPID_PUBLIC_KEY environment variable.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }

  if (!profile?.id) {
    return subscription;
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: profile.id,
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,endpoint' });

  if (error) {
    console.error('Failed to store push subscription:', error);
  }

  return subscription;
};

export const unsubscribeFromPush = async (profile: Profile | null) => {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();

    if (profile?.id) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', profile.id)
        .eq('endpoint', subscription.endpoint);
    }
  }
};

export const sendDriverPushNotification = async (
  driverId: string,
  payload: { title?: string; body?: string; data?: Record<string, unknown> }
) => {
  const response = await fetch('/.netlify/functions/send-driver-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: driverId, ...payload })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send push notification: ${response.status} ${text}`);
  }

  return response.json();
};
