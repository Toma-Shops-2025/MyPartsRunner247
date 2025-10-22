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
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-teal-500 to-blue-600 text-white border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Install MyPartsRunner
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm opacity-90">
            {installSource === 'ios' 
              ? 'Add to your home screen for quick access and offline support!'
              : 'Install our app for a better experience with offline support and push notifications!'
            }
          </p>
          
          <div className="flex gap-2">
            {installSource === 'ios' ? (
              <div className="flex-1">
                <Button
                  onClick={() => setShowInstallPrompt(false)}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Add to Home Screen
                </Button>
                <p className="text-xs mt-1 opacity-75">
                  Tap the share button and select "Add to Home Screen"
                </p>
              </div>
            ) : (
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs opacity-75">
            <div className="flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              <span>Push notifications</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
