import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Eye, EyeOff, Monitor, Smartphone, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

interface RTMPCredentialsProps {
  rtmpUrl: string;
  streamKey: string;
  hlsPlaybackUrl: string;
}

export const RTMPCredentials = ({ rtmpUrl, streamKey, hlsPlaybackUrl }: RTMPCredentialsProps) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHls, setCopiedHls] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const copyToClipboard = async (text: string, type: 'url' | 'key' | 'hls' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else if (type === 'hls') {
        setCopiedHls(true);
        setTimeout(() => setCopiedHls(false), 2000);
      } else if (type === 'all') {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }

      toast({
        title: "Copied!",
        description: type === 'all' 
          ? 'All credentials copied to clipboard' 
          : `${type === 'url' ? 'RTMP URL' : type === 'key' ? 'Stream Key' : 'HLS URL'} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyAllCredentials = () => {
    const allCreds = `RTMP URL: ${rtmpUrl}\nStream Key: ${streamKey}\nHLS Playback URL: ${hlsPlaybackUrl}`;
    copyToClipboard(allCreds, 'all');
  };

  const maskedKey = showKey ? streamKey : '•'.repeat(Math.min(streamKey.length, 32));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">Stream Credentials</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Use these credentials in OBS, Streamlabs, or your streaming software
            </CardDescription>
          </div>
          {isMobile && (
            <Button 
              onClick={copyAllCredentials}
              variant="default"
              size="sm"
              className="w-full sm:w-auto shrink-0"
            >
              {copiedAll ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="rtmpUrl" className="text-sm sm:text-base">RTMP Server URL</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="rtmpUrl"
              value={rtmpUrl}
              readOnly
              className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'} min-h-[44px]`}
            />
            <Button
              variant="outline"
              size={isMobile ? "default" : "icon"}
              onClick={() => copyToClipboard(rtmpUrl, 'url')}
              className={isMobile ? "w-full sm:w-auto justify-center min-h-[44px]" : ""}
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isMobile && <span className="ml-2">Copy URL</span>}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="streamKey" className="text-sm sm:text-base">Stream Key</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="streamKey"
              value={maskedKey}
              readOnly
              type={showKey ? "text" : "password"}
              className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'} min-h-[44px]`}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size={isMobile ? "default" : "icon"}
                onClick={() => setShowKey(!showKey)}
                className={isMobile ? "flex-1 min-h-[44px]" : ""}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isMobile && <span className="ml-2">{showKey ? "Hide" : "Show"}</span>}
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "default" : "icon"}
                onClick={() => copyToClipboard(streamKey, 'key')}
                className={isMobile ? "flex-1 min-h-[44px]" : ""}
              >
                {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {isMobile && <span className="ml-2">Copy</span>}
              </Button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Keep this private! Anyone with your stream key can stream to your channel.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hlsUrl" className="text-sm sm:text-base">HLS Playback URL</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="hlsUrl"
              value={hlsPlaybackUrl}
              readOnly
              className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'} min-h-[44px]`}
            />
            <Button
              variant="outline"
              size={isMobile ? "default" : "icon"}
              onClick={() => copyToClipboard(hlsPlaybackUrl, 'hls')}
              className={isMobile ? "w-full sm:w-auto justify-center min-h-[44px]" : ""}
            >
              {copiedHls ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isMobile && <span className="ml-2">Copy URL</span>}
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Use this URL to preview your stream or embed it elsewhere
          </p>
        </div>

        <Tabs defaultValue="desktop" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Desktop Setup
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Setup
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="desktop" className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">OBS Studio Setup:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open OBS Studio or your streaming software</li>
                <li>Go to Settings → Stream</li>
                <li>Service: Custom</li>
                <li>Paste the RTMP Server URL</li>
                <li>Paste the Stream Key</li>
                <li>Click "Start Streaming"</li>
              </ol>
            </div>
          </TabsContent>
          
          <TabsContent value="mobile" className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended: Larix Broadcaster</strong>
                <p className="text-xs mt-1">Professional RTMP streaming app, free with optional in-app purchases</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => window.open('https://apps.apple.com/app/larix-broadcaster/id1042474385', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    iOS App Store
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.wmspanel.larix_broadcaster', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Play
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Larix Broadcaster Setup:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download Larix Broadcaster from your app store</li>
                <li>Open the app and tap Settings (gear icon)</li>
                <li>Tap "Connections" → "New Connection"</li>
                <li>Enter a name for your stream (e.g., "SubAmerica Live")</li>
                <li>Set Mode to "RTMP"</li>
                <li>Paste your RTMP Server URL in the "URL" field above</li>
                <li>Paste your Stream Key in the "Stream name" field</li>
                <li>Save the connection and select it from the list</li>
                <li>Tap the red record button to go live!</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Alternative Apps:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><strong>Streamlabs Mobile</strong> - User-friendly with built-in alerts</li>
                <li><strong>Prism Live Studio</strong> - Feature-rich with multi-camera support</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                All these apps work the same way - just paste your RTMP URL and Stream Key
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Mobile Streaming Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use Wi-Fi for best quality (or strong LTE/5G)</li>
                <li>Keep your phone plugged in while streaming</li>
                <li>Use landscape mode for better viewing experience</li>
                <li>Test your stream before going live</li>
                <li>Consider using a phone tripod or stabilizer</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
