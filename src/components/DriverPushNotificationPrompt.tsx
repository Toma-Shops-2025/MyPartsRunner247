import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, CheckCircle, AlertCircle, X } from 'lucide-react';
import pushNotificationService from '@/services/PushNotificationService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const DriverPushNotificationPrompt: React.FC = () => {
  const { user, profile } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      checkSubscriptionStatus();
    }
  }, [user, profile]);

  const checkSubscriptionStatus = async () => {
    if (!user?.id) return;

    setIsChecking(true);
    try {
      // Check browser subscription
      const browserSub = await pushNotificationService.hasActiveSubscription();
      
      // Check database subscription
      const { data: dbSubs, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint')
        .eq('user_id', user.id)
        .limit(1);

      const dbSub = dbSubs && dbSubs.length > 0;
      const hasSub = browserSub && dbSub;

      setHasSubscription(hasSub);
      
      if (!hasSub) {
        console.log('🔔 Driver push notification status:');
        console.log(`   Browser subscription: ${browserSub ? '✅' : '❌'}`);
        console.log(`   Database subscription: ${dbSub ? '✅' : '❌'}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Email: ${profile?.email || 'unknown'}`);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setHasSubscription(false);
    } finally {
      setIsChecking(false);
    }
  };

  const enablePushNotifications = async () => {
    if (!user?.id) return;

    setIsEnabling(true);
    try {
      // Request permission
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings to receive order alerts.',
          variant: 'destructive'
        });
        setIsEnabling(false);
        return;
      }

      if (permission === 'granted') {
        // Subscribe to push notifications
        const subscription = await pushNotificationService.subscribe();
        
        if (subscription) {
          toast({
            title: 'Push Notifications Enabled',
            description: 'You will now receive notifications for new orders!',
            variant: 'default'
          });
          await checkSubscriptionStatus();
        } else {
          toast({
            title: 'Failed to Enable',
            description: 'Could not enable push notifications. Please try again.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while enabling push notifications.',
        variant: 'destructive'
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Don't show if not a driver, already has subscription, or dismissed
  if (!user || profile?.user_type !== 'driver' || hasSubscription || dismissed || isChecking) {
    return null;
  }

  return (
    <Card className="bg-yellow-900/20 border-yellow-600/50 mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-yellow-300">
            <Bell className="w-5 h-5" />
            Enable Push Notifications
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0 text-yellow-300 hover:text-yellow-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="bg-yellow-900/30 border-yellow-600/50 mb-4">
          <AlertCircle className="w-4 h-4 text-yellow-300" />
          <AlertDescription className="text-yellow-200">
            <strong>Important:</strong> You need to enable push notifications to receive alerts for new orders.
            Without this, you won't be notified when orders become available.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <div className="text-sm text-gray-300">
            <p className="mb-2">Current status:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>User ID: <code className="text-xs bg-gray-800 px-1 rounded">{user.id}</code></li>
              <li>Email: <code className="text-xs bg-gray-800 px-1 rounded">{profile?.email || 'unknown'}</code></li>
              <li>Push notifications: <span className="text-red-400">Not enabled</span></li>
            </ul>
          </div>
          
          <Button
            onClick={enablePushNotifications}
            disabled={isEnabling}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isEnabling ? 'Enabling...' : 'Enable Push Notifications'}
          </Button>
          
          <p className="text-xs text-gray-400 text-center">
            Click the button above to enable push notifications. You'll be asked to allow notifications in your browser.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverPushNotificationPrompt;

