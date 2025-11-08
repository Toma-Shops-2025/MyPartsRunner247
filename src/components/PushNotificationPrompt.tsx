import { useMemo } from 'react';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const PushNotificationPrompt = () => {
  const { profile } = useAuth();
  const {
    isSupported,
    permission,
    hasSubscription,
    isProcessing,
    error,
    enablePush,
    disablePush
  } = usePushNotifications();

  const shouldRender = useMemo(() => {
    if (!profile || profile.user_type !== 'driver') return false;
    if (!isSupported) return false;
    if (permission === 'granted' && hasSubscription) return false;
    return true;
  }, [profile, isSupported, permission, hasSubscription]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Card className="mb-6 border border-amber-500/40 bg-amber-50/70 p-4 text-amber-900 shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-amber-100 p-2">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Enable instant driver alerts</h3>
            <p className="text-sm text-amber-800">
              Turn on push notifications so you never miss a dispatch, schedule change, or earnings update.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {permission === 'granted' && !hasSubscription && (
            <span className="flex items-center gap-1 text-sm text-amber-700">
              <CheckCircle className="h-4 w-4" />
              Permission granted, finalizing setup…
            </span>
          )}
          <Button
            disabled={isProcessing}
            onClick={() => enablePush()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up…
              </>
            ) : (
              'Enable Push Alerts'
            )}
          </Button>
          {permission === 'granted' && hasSubscription && (
            <Button variant="ghost" disabled={isProcessing} onClick={disablePush}>
              Disable
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PushNotificationPrompt;
