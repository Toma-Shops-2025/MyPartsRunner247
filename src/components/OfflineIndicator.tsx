// OFFLINE INDICATOR - Show Connection Status
// ==========================================

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <Alert className={`${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Back online!</strong> Your connection has been restored.
              </AlertDescription>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>You're offline.</strong> Some features may be limited, but you can still browse cached content.
              </AlertDescription>
            </>
          )}
        </div>
      </Alert>
    </div>
  );
};

export default OfflineIndicator;
