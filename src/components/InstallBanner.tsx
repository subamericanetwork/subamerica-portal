import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { toast } from 'sonner';

export const InstallBanner = () => {
  const { promptInstall, isInstalled, isIOS, canInstall, debugInfo } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the banner
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Show banner immediately for testing (reduced from 3 seconds to 1 second)
    if (!isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [dismissed, isInstalled]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isIOS) {
      toast.info(
        "To install: Tap the Share button in Safari and select 'Add to Home Screen'",
        { duration: 6000 }
      );
    } else {
      const success = await promptInstall();
      if (success) {
        setVisible(false);
        toast.success('App installed successfully!');
      }
    }
  };

  if (!visible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <div className="gradient-card border border-primary/20 rounded-lg shadow-lg p-4 backdrop-blur-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install Subamerica App</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {isIOS 
                ? "Add to your home screen for quick access and offline features"
                : canInstall 
                  ? "Install our app for a better experience with offline access"
                  : "Get the app for better experience"
              }
            </p>
            
            {/* Debug status indicator */}
            <div className="text-xs space-y-1 mb-2">
              <div className="flex items-center gap-2">
                <span className={canInstall ? "text-green-500" : "text-yellow-500"}>
                  {canInstall ? "✓" : "⚠"} Can Install: {canInstall ? "Yes" : "No"}
                </span>
              </div>
              {!canInstall && !isIOS && (
                <p className="text-yellow-500 text-xs">
                  Tap the Chrome menu (⋮) → "Install app" or "Add to Home screen"
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1"
            disabled={!canInstall && !isIOS}
          >
            {isIOS ? (
              <>
                <Share className="h-4 w-4 mr-2" />
                Install App
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {canInstall ? "Install" : "See Instructions"}
              </>
            )}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            Not now
          </Button>
        </div>
        
        {/* Debug toggle */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center"
        >
          {showDebug ? "Hide" : "Show"} Debug Info
        </button>
        
        {showDebug && (
          <div className="mt-2 p-2 bg-background/50 rounded text-xs max-h-32 overflow-auto">
            {debugInfo.map((log, i) => (
              <div key={i} className="font-mono">{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
