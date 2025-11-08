import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, Bell, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DownloadAppPage: React.FC = () => {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const installed = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
    setIsInstalled(installed);

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
      }
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">App Already Installed!</h2>
            <p className="text-gray-300 mb-6">
              MyPartsRunner is already installed on your device. Check your home screen or app drawer.
            </p>
            <Button onClick={() => navigate('/')} className="w-full bg-teal-600 hover:bg-teal-700">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get the MyPartsRunner App
            </h1>
            <p className="text-xl text-gray-300">
              Install for a faster, better experience with offline support and instant notifications
            </p>
          </div>

          {/* Installation Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Android/Chrome */}
            {!isIOS && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-teal-400" />
                    {isAndroid ? 'Android' : 'Chrome'} Installation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {installPrompt ? (
                    <>
                      <p className="text-gray-300">
                        Click the button below to install MyPartsRunner on your device.
                      </p>
                      <Button
                        onClick={handleInstall}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        size="lg"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Install App Now
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-300 mb-4">Manual installation steps:</p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                        <li>Look for the install icon in your browser's address bar</li>
                        <li>Or go to the browser menu (⋮) and select "Install app"</li>
                        <li>Confirm the installation</li>
                        <li>The app will appear on your home screen</li>
                      </ol>
                      <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Return to Site
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* iOS */}
            {isIOS && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-teal-400" />
                    iPhone/iPad Installation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 mb-4">Follow these steps to add MyPartsRunner to your home screen:</p>
                  <ol className="list-decimal list-inside space-y-3 text-gray-300 text-sm">
                    <li>
                      Tap the <strong className="text-white">Share</strong> button (📤) 
                      at the bottom of your Safari browser
                    </li>
                    <li>
                      Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>
                    </li>
                    <li>
                      Tap <strong className="text-white">"Add"</strong> in the top right corner
                    </li>
                    <li>
                      The MyPartsRunner icon will appear on your home screen
                    </li>
                  </ol>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Return to Site
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">App Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Faster Performance</h3>
                      <p className="text-gray-400 text-sm">Optimized loading and instant access to all features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Real-Time Updates</h3>
                      <p className="text-gray-400 text-sm">Stay on top of orders and account changes with live dashboards.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Offline Support</h3>
                      <p className="text-gray-400 text-sm">Access key features even without internet connection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Home Screen Access</h3>
                      <p className="text-gray-400 text-sm">Quick launch from your device home screen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center text-gray-400">
                <p className="mb-2">
                  <strong className="text-white">No app store required!</strong> This is a Progressive Web App (PWA) 
                  that works just like a native app but installs directly from your browser.
                </p>
                <p className="text-sm">
                  Works on all modern browsers: Chrome, Safari, Edge, Firefox, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DownloadAppPage;
