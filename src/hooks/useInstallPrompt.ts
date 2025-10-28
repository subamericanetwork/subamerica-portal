import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`[PWA Debug] ${logMessage}`);
    setDebugInfo(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addDebugLog('useInstallPrompt hook initialized');
    addDebugLog(`User Agent: ${navigator.userAgent}`);
    addDebugLog(`Display Mode: ${window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'}`);
    
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        addDebugLog('App is already installed (standalone mode)');
        setIsInstalled(true);
        return true;
      }
      if ((window.navigator as any).standalone === true) {
        addDebugLog('App is already installed (iOS standalone)');
        setIsInstalled(true);
        return true;
      }
      addDebugLog('App is not installed');
      return false;
    };

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      addDebugLog(`iOS Device: ${isIOSDevice}`);
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };

    if (checkInstalled()) {
      return;
    }

    checkIOS();

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      addDebugLog('beforeinstallprompt event fired!');
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      addDebugLog('Service Worker is supported');
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          addDebugLog(`Service Worker registered: ${reg.active?.state || 'pending'}`);
        } else {
          addDebugLog('No Service Worker registration found');
        }
      });
    } else {
      addDebugLog('Service Worker NOT supported');
    }

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      addDebugLog('App installed successfully!');
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    // Set a timeout to log if prompt hasn't fired
    const timeout = setTimeout(() => {
      if (!installPrompt) {
        addDebugLog('beforeinstallprompt has NOT fired after 5 seconds');
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timeout);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      addDebugLog('Cannot prompt install - no installPrompt available');
      return false;
    }

    try {
      addDebugLog('Showing install prompt...');
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      addDebugLog(`User choice: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      addDebugLog(`Error prompting install: ${error}`);
      console.error('Error prompting install:', error);
      return false;
    }
  };

  return {
    installPrompt,
    promptInstall,
    isInstalled,
    isIOS,
    canInstall: !!installPrompt || (isIOS && !isInstalled),
    debugInfo
  };
};
