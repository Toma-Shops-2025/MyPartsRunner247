import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CheckCircle, XCircle, Clock, Smartphone, Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

const NotificationSystemTest: React.FC = () => {
  const { user, profile } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
  }, []);

  const addTestResult = (test: string, status: 'success' | 'error', message: string, details?: string) => {
    setTestResults(prev => [...prev, { test, status, message, details }]);
  };

  const runNotificationTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check if user is authenticated
    if (!user) {
      addTestResult('Authentication', 'error', 'User not authenticated', 'Please log in to test notifications');
      setIsRunning(false);
      return;
    }
    addTestResult('Authentication', 'success', 'User authenticated', `User: ${user.email}`);

    // Test 2: Check browser support
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!isSupported) {
      addTestResult('Browser Support', 'error', 'Push notifications not supported', 'Browser does not support Service Worker or Push API');
    } else {
      addTestResult('Browser Support', 'success', 'Push notifications supported', 'Service Worker and Push API available');
    }

    // Test 3: Check notification permission
    const permission = Notification.permission;
    if (permission === 'denied') {
      addTestResult('Permission', 'error', 'Notifications denied', 'User has denied notification permission');
    } else if (permission === 'granted') {
      addTestResult('Permission', 'success', 'Notifications granted', 'User has granted notification permission');
    } else {
      addTestResult('Permission', 'error', 'Permission not requested', 'Notification permission not yet requested');
    }

    // Test 4: Check service worker registration
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        addTestResult('Service Worker', 'success', 'Service worker registered', `Scope: ${registration.scope}`);
      } else {
        addTestResult('Service Worker', 'error', 'Service worker not registered', 'No service worker found');
      }
    } catch (error) {
      addTestResult('Service Worker', 'error', 'Service worker error', `Error: ${error.message}`);
    }

    // Test 5: Check push subscription
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          addTestResult('Push Subscription', 'success', 'Push subscription active', 'User is subscribed to push notifications');
        } else {
          addTestResult('Push Subscription', 'error', 'No push subscription', 'User is not subscribed to push notifications');
        }
      }
    } catch (error) {
      addTestResult('Push Subscription', 'error', 'Push subscription error', `Error: ${error.message}`);
    }

    // Test 6: Test browser notification
    if (permission === 'granted') {
      try {
        const testNotification = new Notification('MyPartsRunner Test', {
          body: 'This is a test notification from MyPartsRunner! 🚀',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-notification'
        });
        
        setTimeout(() => {
          testNotification.close();
        }, 3000);
        
        addTestResult('Browser Notification', 'success', 'Test notification sent', 'Browser notification displayed successfully');
      } catch (error) {
        addTestResult('Browser Notification', 'error', 'Browser notification failed', `Error: ${error.message}`);
      }
    }

    // Test 7: Test service worker notification
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: 'MyPartsRunner SW Test',
            body: 'This is a service worker notification! 🔔',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'sw-test-notification'
          }
        });
        addTestResult('Service Worker Notification', 'success', 'SW notification sent', 'Service worker notification triggered');
      } else {
        addTestResult('Service Worker Notification', 'error', 'SW notification failed', 'Service worker not active');
      }
    } catch (error) {
      addTestResult('Service Worker Notification', 'error', 'SW notification error', `Error: ${error.message}`);
    }

    // Test 8: Test real-time order updates (if customer)
    if (profile?.user_type === 'customer') {
      try {
        // Check if customer has orders
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, status, updated_at')
          .eq('customer_id', user.id)
          .limit(1);

        if (error) {
          addTestResult('Order Updates', 'error', 'Database error', `Error: ${error.message}`);
        } else if (orders && orders.length > 0) {
          addTestResult('Order Updates', 'success', 'Order data available', `Found ${orders.length} order(s) for real-time updates`);
        } else {
          addTestResult('Order Updates', 'error', 'No orders found', 'Customer has no orders to track');
        }
      } catch (error) {
        addTestResult('Order Updates', 'error', 'Order check failed', `Error: ${error.message}`);
      }
    }

    // Test 9: Test VAPID configuration
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (vapidKey) {
      addTestResult('VAPID Configuration', 'success', 'VAPID key configured', 'VAPID public key is set');
    } else {
      addTestResult('VAPID Configuration', 'error', 'VAPID key missing', 'VAPID public key not configured');
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getDeviceIcon = () => {
    return deviceType === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <Alert className="bg-yellow-900/20 border-yellow-600/30">
            <Bell className="w-4 h-4" />
            <AlertDescription className="text-yellow-300">
              Please log in to test the notification system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5" />
          Notification System Test
          <div className="flex items-center gap-1 ml-auto text-sm text-gray-400">
            {getDeviceIcon()}
            {deviceType}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runNotificationTests}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Run Notification Tests
              </>
            )}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Test Results:</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{result.test}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'success' ? 'bg-green-900/30 text-green-300' :
                        result.status === 'error' ? 'bg-red-900/30 text-red-300' :
                        'bg-yellow-900/30 text-yellow-300'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-400 mt-1">{result.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert className="bg-blue-900/20 border-blue-600/30">
          <Bell className="w-4 h-4" />
          <AlertDescription className="text-blue-300">
            This test will check all aspects of the notification system including browser support, 
            permissions, service worker registration, and push subscriptions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default NotificationSystemTest;
