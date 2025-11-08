// PWA INSTALLATION PROMPT - Make App Installable
// ===============================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSource, setInstallSource] = useState<'ios' | 'android' | 'desktop' | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      setInstallSource('ios');
      setShowInstallPrompt(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
      setInstallSource('android');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setShowInstallPrompt(false);
      } else {
        console.log('PWA installation dismissed');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-gradient-to-r from-teal-600 to-blue-600 text-white border-0 shadow-2xl animate-in slide-in-from-bottom-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="w-6 h-6" />
            Get the MyPartsRunner App
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-base font-medium">
            {installSource === 'ios' 
              ? '📱 Install for faster access and offline mode!'
              : '🚀 Install our app for a faster, better experience with offline support and real-time dashboards!'
            }
          </p>
          
          <div className="flex gap-2">
            {installSource === 'ios' ? (
              <div className="flex-1 space-y-2">
                <Button
                  onClick={() => setShowInstallPrompt(false)}
                  className="w-full bg-white text-teal-600 hover:bg-gray-100 font-semibold py-3 text-base shadow-lg"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Show Instructions
                </Button>
                <p className="text-xs opacity-90 leading-relaxed">
                  Tap <span className="font-bold">Share</span> (📤) then select <span className="font-bold">"Add to Home Screen"</span>
                </p>
              </div>
            ) : (
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-teal-600 hover:bg-gray-100 font-semibold py-3 text-base shadow-lg"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Install Now
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Monitor className="w-3 h-3" />
              </div>
              <span className="font-medium">Works Offline</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Smartphone className="w-3 h-3" />
              </div>
              <span className="font-medium">Instant Updates</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
