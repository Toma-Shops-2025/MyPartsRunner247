import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, Smartphone } from 'lucide-react';

const IOSDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    
    // Collect debug information
    const info = {
      userAgent: navigator.userAgent,
      isIOS,
      isSafari,
      isChrome,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      localStorageSupported: typeof Storage !== 'undefined',
      sessionStorageSupported: typeof sessionStorage !== 'undefined',
      pushManagerSupported: 'PushManager' in window,
      notificationSupported: 'Notification' in window,
      geolocationSupported: 'geolocation' in navigator,
      currentURL: window.location.href,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      timestamp: new Date().toISOString()
    };

    setDebugInfo(info);

    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      setErrors(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      setErrors(prev => [...prev, `WARN: ${args.join(' ')}`]);
      originalWarn.apply(console, args);
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      setErrors(prev => [...prev, `UNHANDLED ERROR: ${event.error?.message || event.message}`]);
    });

    window.addEventListener('unhandledrejection', (event) => {
      setErrors(prev => [...prev, `UNHANDLED PROMISE REJECTION: ${event.reason}`]);
    });

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const copyToClipboard = () => {
    const debugText = `
MyPartsRunner iOS Debug Report
=============================

Device Info:
- User Agent: ${debugInfo?.userAgent}
- Platform: ${debugInfo?.platform}
- Is iOS: ${debugInfo?.isIOS}
- Is Safari: ${debugInfo?.isSafari}
- Is Chrome: ${debugInfo?.isChrome}

Screen Info:
- Screen: ${debugInfo?.screenWidth}x${debugInfo?.screenHeight}
- Window: ${debugInfo?.windowWidth}x${debugInfo?.windowHeight}
- Pixel Ratio: ${debugInfo?.devicePixelRatio}

Features:
- Service Worker: ${debugInfo?.serviceWorkerSupported}
- Local Storage: ${debugInfo?.localStorageSupported}
- Push Notifications: ${debugInfo?.pushManagerSupported}
- Geolocation: ${debugInfo?.geolocationSupported}

Network:
- Online: ${debugInfo?.onLine}
- Protocol: ${debugInfo?.protocol}
- Hostname: ${debugInfo?.hostname}

Errors:
${errors.length > 0 ? errors.join('\n') : 'No errors detected'}

Timestamp: ${debugInfo?.timestamp}
    `.trim();

    navigator.clipboard.writeText(debugText).then(() => {
      alert('Debug info copied to clipboard! You can now paste it in an email or message.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = debugText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Debug info copied to clipboard!');
    });
  };

  if (!debugInfo?.isIOS) {
    return null; // Only show on iOS devices
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
          size="sm"
        >
          <Smartphone className="w-4 h-4" />
        </Button>
      ) : (
        <Card className="w-80 max-h-96 overflow-y-auto bg-white border border-gray-300 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                iOS Debug Panel
              </span>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center text-xs">
                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                <span>iOS Device Detected</span>
              </div>
              <div className="flex items-center text-xs">
                {debugInfo?.isSafari ? (
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                )}
                <span>Safari: {debugInfo?.isSafari ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center text-xs">
                {debugInfo?.isChrome ? (
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                )}
                <span>Chrome: {debugInfo?.isChrome ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center text-xs">
                {debugInfo?.serviceWorkerSupported ? (
                  <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500 mr-1" />
                )}
                <span>Service Worker: {debugInfo?.serviceWorkerSupported ? 'Supported' : 'Not Supported'}</span>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-red-600">Errors Detected:</div>
                <div className="max-h-20 overflow-y-auto text-xs text-red-500">
                  {errors.slice(-5).map((error, index) => (
                    <div key={index} className="truncate">{error}</div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={copyToClipboard}
              className="w-full text-xs"
              size="sm"
            >
              Copy Debug Info
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IOSDebugPanel;
