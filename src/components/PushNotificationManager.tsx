// FREE Push Notification Manager Component
// =========================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Settings } from 'lucide-react';
import pushNotificationService from '@/services/PushNotificationService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { MobileNotificationHelper } from '@/utils/mobileNotificationHelper';

interface NotificationSettings {
  orderUpdates: boolean;
  driverAlerts: boolean;
  earnings: boolean;
  promotions: boolean;
}

const PushNotificationManager: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    orderUpdates: true,
    driverAlerts: true,
    earnings: true,
    promotions: false
  });

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(pushNotificationService.isPushSupported());
    setPermission(Notification.permission);
    
    // Check if already subscribed
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      // Request permission first
      const newPermission = await pushNotificationService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        const subscription = await pushNotificationService.subscribe();
        if (subscription && user?.id) {
          // Persist subscription in Supabase
          const keys = subscription.toJSON().keys || {};
          await supabase.from('push_subscriptions').upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_agent: navigator.userAgent
          });
          setIsSubscribed(true);
          localStorage.setItem('notificationSettings', JSON.stringify(settings));
        }
      } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      alert('Failed to subscribe to notifications. Please try again.');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        localStorage.removeItem('notificationSettings');
        // Remove server-side subscription
        if (user?.id) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      alert('Failed to unsubscribe from notifications. Please try again.');
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const testNotification = async () => {
    try {
      // Use mobile-specific helper for better mobile support
      if (MobileNotificationHelper.isMobile()) {
        const success = await MobileNotificationHelper.testMobileNotification();
        if (!success) {
          const errorMessage = MobileNotificationHelper.getMobileErrorMessage(new Error('Mobile notification failed'));
          alert(errorMessage);
        }
        return;
      }

      // Desktop notification handling
      // First, ensure we have permission
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Please enable notifications in your browser settings first!');
          return;
        }
      }

      // For desktop, use the service worker approach
      try {
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Send message to service worker to show notification
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            payload: {
              title: 'MyPartsRunner Test',
              body: 'This is a test notification! 🚀',
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: 'test-notification',
              data: { test: true }
            }
          });
        } else {
          // Fallback to direct notification
          const notification = new Notification('MyPartsRunner Test', {
            body: 'This is a test notification! 🚀',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'test-notification'
          });
          
          // Auto-close after 5 seconds
          setTimeout(() => {
            notification.close();
          }, 5000);
        }
      } catch (swError) {
        console.warn('Service worker notification failed, trying direct approach:', swError);
        
        // Fallback to direct notification
        const notification = new Notification('MyPartsRunner Test', {
          body: 'This is a test notification! 🚀',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-notification'
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      // Provide more helpful error message
      if (MobileNotificationHelper.isMobile()) {
        const errorMessage = MobileNotificationHelper.getMobileErrorMessage(error);
        alert(errorMessage);
      } else {
        alert('Test notification failed. Please check your browser settings.');
      }
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <BellOff className="w-5 h-5" />
            <span>Push notifications are not supported in this browser.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If notifications are already set up, show minimal status
  if (isSubscribed && permission === 'granted') {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Bell className="w-5 h-5" />
            <span>Push notifications are enabled</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5 text-teal-400" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Permission Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            permission === 'granted' ? 'bg-green-900 text-green-300' :
            permission === 'denied' ? 'bg-red-900 text-red-300' :
            'bg-yellow-900 text-yellow-300'
          }`}>
            {permission === 'granted' ? 'Granted' :
             permission === 'denied' ? 'Denied' : 'Not Set'}
          </span>
        </div>

        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Subscription Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            isSubscribed ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
          }`}>
            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button 
              onClick={handleSubscribe}
              disabled={permission === 'denied'}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          ) : (
            <Button 
              onClick={handleUnsubscribe}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Disable Notifications
            </Button>
          )}
          
          {isSubscribed && (
            <Button 
              onClick={testNotification}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Test
            </Button>
          )}
        </div>

        {/* Notification Settings */}
        {isSubscribed && (
          <div className="space-y-3 pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Order Updates</span>
              <Switch
                checked={settings.orderUpdates}
                onCheckedChange={(checked) => handleSettingChange('orderUpdates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Driver Alerts</span>
              <Switch
                checked={settings.driverAlerts}
                onCheckedChange={(checked) => handleSettingChange('driverAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Earnings Updates</span>
              <Switch
                checked={settings.earnings}
                onCheckedChange={(checked) => handleSettingChange('earnings', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Promotions</span>
              <Switch
                checked={settings.promotions}
                onCheckedChange={(checked) => handleSettingChange('promotions', checked)}
              />
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-400 mt-4">
          <p>• Notifications help you stay updated on order status</p>
          <p>• You can customize which notifications to receive</p>
          <p>• Notifications work even when the app is closed</p>
          {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
            <div className="mt-2 p-2 bg-blue-900 border border-blue-700 rounded">
              <p className="text-blue-300 font-medium">📱 Mobile Tips:</p>
              <p>• Make sure notifications are enabled in your browser</p>
              <p>• On iOS: Go to Settings → Safari → Notifications</p>
              <p>• On Android: Check browser notification settings</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;