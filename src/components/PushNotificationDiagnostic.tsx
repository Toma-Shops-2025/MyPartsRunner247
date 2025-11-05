import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import pushNotificationService from '@/services/PushNotificationService';
import PushApiService from '@/services/PushApiService';

const PushNotificationDiagnostic: React.FC = () => {
  const { user, profile } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {};

    // 1. Check VAPID key
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    results.vapidKey = {
      configured: !!vapidKey,
      value: vapidKey ? vapidKey.substring(0, 20) + '...' : 'Not set'
    };

    // 2. Check browser support
    results.browserSupport = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window
    };

    // 3. Check notification permission
    results.permission = {
      status: Notification.permission,
      granted: Notification.permission === 'granted'
    };

    // 4. Check service worker registration
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      results.serviceWorker = {
        registered: !!registration,
        active: !!registration?.active,
        scope: registration?.scope || 'N/A'
      };
    } catch (e) {
      results.serviceWorker = {
        registered: false,
        error: String(e)
      };
    }

    // 5. Check if user has active subscription in browser
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        results.browserSubscription = {
          exists: !!subscription,
          endpoint: subscription?.endpoint?.substring(0, 50) + '...' || 'None'
        };
      } else {
        results.browserSubscription = {
          exists: false,
          error: 'No service worker registered'
        };
      }
    } catch (e) {
      results.browserSubscription = {
        exists: false,
        error: String(e)
      };
    }

    // 6. Check database subscription
    if (user?.id) {
      try {
        const { data: dbSubs, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);

        results.databaseSubscription = {
          exists: !error && dbSubs && dbSubs.length > 0,
          count: dbSubs?.length || 0,
          error: error?.message || null,
          subscriptions: dbSubs || []
        };
      } catch (e) {
        results.databaseSubscription = {
          exists: false,
          error: String(e)
        };
      }
    }

    // 7. Check user profile
    results.user = {
      id: user?.id || 'Not logged in',
      email: user?.email || 'Not logged in',
      userType: profile?.user_type || 'Unknown'
    };

    setDiagnostics(results);
    setLoading(false);
  };

  const testNotification = async () => {
    setTesting(true);
    try {
      // Test browser notification
      if (Notification.permission === 'granted') {
        await pushNotificationService.sendNotification({
          title: 'Test Notification',
          body: 'This is a test notification from MyPartsRunner!',
          data: { test: true }
        });
      }

      // Test push notification via API
      if (user?.id) {
        const result = await PushApiService.sendToUsers([user.id], {
          title: 'Test Push Notification',
          body: 'This is a test push notification sent via the API!',
          data: { test: true, timestamp: new Date().toISOString() }
        });
        console.log('Push API result:', result);
      }
    } catch (error) {
      console.error('Test notification error:', error);
    }
    setTesting(false);
  };

  const subscribeToPush = async () => {
    try {
      if (!pushNotificationService.isPushSupported()) {
        alert('Push notifications are not supported on this device');
        return;
      }

      const permission = await pushNotificationService.requestPermission();
      if (permission !== 'granted') {
        alert(`Permission ${permission}. Please enable notifications in your browser settings.`);
        return;
      }

      const subscription = await pushNotificationService.subscribe();
      if (subscription) {
        alert('Successfully subscribed to push notifications!');
        await runDiagnostics();
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Error subscribing: ' + (error as Error).message);
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Running diagnostics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Push Notification Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* VAPID Key */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">VAPID Public Key</p>
              <p className="text-gray-400 text-sm">{diagnostics.vapidKey?.value || 'Not set'}</p>
            </div>
            <StatusIcon status={diagnostics.vapidKey?.configured} />
          </div>

          {/* Browser Support */}
          <div>
            <p className="text-white font-medium mb-2">Browser Support</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Service Worker</span>
                <StatusIcon status={diagnostics.browserSupport?.serviceWorker} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Push Manager</span>
                <StatusIcon status={diagnostics.browserSupport?.pushManager} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Notifications API</span>
                <StatusIcon status={diagnostics.browserSupport?.notifications} />
              </div>
            </div>
          </div>

          {/* Permission */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Notification Permission</p>
              <p className="text-gray-400 text-sm capitalize">{diagnostics.permission?.status || 'Unknown'}</p>
            </div>
            <StatusIcon status={diagnostics.permission?.granted} />
          </div>

          {/* Service Worker */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Service Worker</p>
              <p className="text-gray-400 text-sm">
                {diagnostics.serviceWorker?.registered ? 'Registered' : 'Not registered'}
              </p>
              {diagnostics.serviceWorker?.scope && (
                <p className="text-gray-500 text-xs">{diagnostics.serviceWorker.scope}</p>
              )}
            </div>
            <StatusIcon status={diagnostics.serviceWorker?.registered && diagnostics.serviceWorker?.active} />
          </div>

          {/* Browser Subscription */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Browser Subscription</p>
              <p className="text-gray-400 text-sm">
                {diagnostics.browserSubscription?.exists ? 'Active' : 'None'}
              </p>
              {diagnostics.browserSubscription?.endpoint && (
                <p className="text-gray-500 text-xs truncate">{diagnostics.browserSubscription.endpoint}</p>
              )}
            </div>
            <StatusIcon status={diagnostics.browserSubscription?.exists} />
          </div>

          {/* Database Subscription */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Database Subscription</p>
              <p className="text-gray-400 text-sm">
                {diagnostics.databaseSubscription?.exists 
                  ? `${diagnostics.databaseSubscription.count} subscription(s)` 
                  : 'None'}
              </p>
              {diagnostics.databaseSubscription?.error && (
                <p className="text-red-400 text-xs">{diagnostics.databaseSubscription.error}</p>
              )}
            </div>
            <StatusIcon status={diagnostics.databaseSubscription?.exists} />
          </div>

          {/* User Info */}
          <div>
            <p className="text-white font-medium mb-2">User Info</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">ID: {diagnostics.user?.id}</p>
              <p className="text-gray-300">Email: {diagnostics.user?.email}</p>
              <p className="text-gray-300">Type: {diagnostics.user?.userType}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button 
              onClick={runDiagnostics}
              variant="outline"
              className="flex-1"
            >
              Refresh Diagnostics
            </Button>
            {!diagnostics.permission?.granted && (
              <Button 
                onClick={subscribeToPush}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Enable Push Notifications
              </Button>
            )}
            {diagnostics.permission?.granted && (
              <Button 
                onClick={testNotification}
                disabled={testing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {testing ? 'Testing...' : 'Test Notification'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationDiagnostic;

