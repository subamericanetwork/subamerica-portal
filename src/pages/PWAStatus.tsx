import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Download, Share } from 'lucide-react';
import { toast } from 'sonner';

export default function PWAStatus() {
  const { canInstall, isInstalled, isIOS, promptInstall, debugInfo } = useInstallPrompt();
  const [manifestLoaded, setManifestLoaded] = useState<boolean | null>(null);
  const [swRegistered, setSwRegistered] = useState<boolean | null>(null);
  const [isHttps, setIsHttps] = useState<boolean>(false);

  useEffect(() => {
    // Check HTTPS
    setIsHttps(window.location.protocol === 'https:');

    // Check manifest
    fetch('/manifest.webmanifest')
      .then(response => {
        setManifestLoaded(response.ok);
        return response.json();
      })
      .then(data => {
        console.log('Manifest data:', data);
      })
      .catch(() => setManifestLoaded(false));

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setSwRegistered(!!reg);
        if (reg) {
          console.log('Service Worker state:', reg.active?.state);
        }
      });
    } else {
      setSwRegistered(false);
    }
  }, []);

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    if (status) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const StatusText = ({ status }: { status: boolean | null }) => {
    if (status === null) return <span className="text-yellow-500">Checking...</span>;
    if (status) return <span className="text-green-500">Yes ✓</span>;
    return <span className="text-red-500">No ✗</span>;
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      toast.info(
        "To install: Tap the Share button in Safari and select 'Add to Home Screen'",
        { duration: 8000 }
      );
    } else if (canInstall) {
      const success = await promptInstall();
      if (success) {
        toast.success('App installed successfully!');
      } else {
        toast.error('Installation was cancelled or failed');
      }
    } else {
      toast.info(
        "To install: Tap the Chrome menu (⋮) → 'Install app' or 'Add to Home screen'",
        { duration: 8000 }
      );
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>PWA Installation Status</CardTitle>
          <CardDescription>
            Diagnostic information for Progressive Web App installation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Installation Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Installation Status</h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-background/50 rounded">
                <span className="flex items-center gap-2">
                  <StatusIcon status={isInstalled} />
                  App Installed
                </span>
                <StatusText status={isInstalled} />
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded">
                <span className="flex items-center gap-2">
                  <StatusIcon status={canInstall} />
                  Can Install Now
                </span>
                <StatusText status={canInstall} />
              </div>
            </div>
          </div>

          {/* PWA Criteria */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">PWA Criteria</h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-background/50 rounded">
                <span className="flex items-center gap-2">
                  <StatusIcon status={isHttps} />
                  Served over HTTPS
                </span>
                <StatusText status={isHttps} />
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded">
                <span className="flex items-center gap-2">
                  <StatusIcon status={manifestLoaded} />
                  Manifest Loaded
                </span>
                <StatusText status={manifestLoaded} />
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded">
                <span className="flex items-center gap-2">
                  <StatusIcon status={swRegistered} />
                  Service Worker Registered
                </span>
                <StatusText status={swRegistered} />
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Device Information</h3>
            <div className="p-3 bg-background/50 rounded space-y-2 text-sm">
              <div><strong>Platform:</strong> {isIOS ? 'iOS' : 'Other'}</div>
              <div><strong>User Agent:</strong> <code className="text-xs">{navigator.userAgent}</code></div>
              <div><strong>Display Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</div>
              <div><strong>Service Worker Support:</strong> {'serviceWorker' in navigator ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Debug Logs */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Debug Logs</h3>
            <div className="p-3 bg-background/50 rounded max-h-64 overflow-auto">
              {debugInfo.length > 0 ? (
                <div className="space-y-1 font-mono text-xs">
                  {debugInfo.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No debug logs available</p>
              )}
            </div>
          </div>

          {/* Install Instructions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Installation Instructions</h3>
            {isInstalled ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded text-green-500">
                App is already installed! ✓
              </div>
            ) : isIOS ? (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded space-y-2">
                <p className="font-semibold">For iOS (Safari):</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Tap the Share button <Share className="inline h-4 w-4" /> at the bottom of Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
                <Button onClick={handleInstallClick} className="w-full mt-2">
                  <Share className="h-4 w-4 mr-2" />
                  Show Instructions
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded space-y-2">
                <p className="font-semibold">For Android (Chrome):</p>
                {canInstall ? (
                  <>
                    <p className="text-sm">The automatic install prompt is available. Click the button below:</p>
                    <Button onClick={handleInstallClick} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Install App
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm">If the automatic prompt doesn't appear:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Tap the Chrome menu (⋮) in the top right corner</li>
                      <li>Select "Install app" or "Add to Home screen"</li>
                      <li>Tap "Install" to confirm</li>
                    </ol>
                    <Button onClick={handleInstallClick} className="w-full mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Show Instructions
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Manual refresh button */}
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="w-full"
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
