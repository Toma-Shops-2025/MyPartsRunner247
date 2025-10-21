// FREE Push Notification Manager Component
// =========================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Settings } from 'lucide-react';
import pushNotificationService from '@/services/PushNotificationService';

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
        if (subscription) {
          setIsSubscribed(true);
          // Save settings to localStorage
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
      await pushNotificationService.sendNotification({
        title: 'MyPartsRunner Test',
        body: 'This is a test notification! 🚀',
        icon: '/icon-192x192.png',
        data: { test: true }
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Permission Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            permission === 'granted' ? 'bg-green-100 text-green-800' :
            permission === 'denied' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {permission === 'granted' ? 'Granted' :
             permission === 'denied' ? 'Denied' : 'Not Set'}
          </span>
        </div>

        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Subscription Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
              className="flex-1"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          ) : (
            <Button 
              onClick={handleUnsubscribe}
              variant="outline"
              className="flex-1"
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
            >
              Test
            </Button>
          )}
        </div>

        {/* Notification Settings */}
        {isSubscribed && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Order Updates</span>
              <Switch
                checked={settings.orderUpdates}
                onCheckedChange={(checked) => handleSettingChange('orderUpdates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Driver Alerts</span>
              <Switch
                checked={settings.driverAlerts}
                onCheckedChange={(checked) => handleSettingChange('driverAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Earnings Updates</span>
              <Switch
                checked={settings.earnings}
                onCheckedChange={(checked) => handleSettingChange('earnings', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Promotions</span>
              <Switch
                checked={settings.promotions}
                onCheckedChange={(checked) => handleSettingChange('promotions', checked)}
              />
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 mt-4">
          <p>• Notifications help you stay updated on order status</p>
          <p>• You can customize which notifications to receive</p>
          <p>• Notifications work even when the app is closed</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;