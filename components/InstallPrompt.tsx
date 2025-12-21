import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowInstallBanner(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setIsInstalled(true);

      // Track installation event (you could send this to analytics)
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user has dismissed the banner before
    const hasDismissedInstall = localStorage.getItem('cashflow-install-dismissed');
    if (!hasDismissedInstall && !isInstalled) {
      // Show banner after a delay to avoid immediate annoyance
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 5000);

      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response to the install prompt: ${outcome}`);

      // We've used the prompt, and can't use it again, throw it away
      setDeferredPrompt(null);
      setShowInstallBanner(false);

      // Track the outcome
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Remember that user dismissed it
    localStorage.setItem('cashflow-install-dismissed', 'true');
  };

  // Don't show install prompt on localhost as it doesn't work due to browser security
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Don't show if already installed, no install prompt available, or on localhost
  if (isInstalled || !showInstallBanner || isLocalhost) {
    return null;
  }

  // iOS Safari doesn't support PWA install prompts, show instructions instead
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-emerald-600 text-white p-4 shadow-lg z-[60]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-sm">Install CashFlow</p>
              <p className="text-xs opacity-90 mt-1">
                Tap the share button and then "Add to Home Screen"
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-4 text-white hover:bg-emerald-700 p-2 rounded"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard install prompt for supported browsers
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-emerald-600 text-white p-4 shadow-lg z-[60]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold text-sm">Install CashFlow App</p>
            <p className="text-xs opacity-90 mt-1">
              Install our app for a better experience with offline support and quick access
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-emerald-700 px-3 py-2 rounded text-sm"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-white text-emerald-600 hover:bg-gray-100 px-4 py-2 rounded text-sm font-semibold"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;