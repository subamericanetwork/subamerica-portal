import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Eye, EyeOff, Monitor, Smartphone, ExternalLink, Shield, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [useSecure, setUseSecure] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Generate both RTMP URLs
  const rtmpUrlInsecure = rtmpUrl.replace('rtmps://', 'rtmp://').replace(':443', ':5222');
  const rtmpUrlSecure = rtmpUrl.includes('rtmps://') ? rtmpUrl : rtmpUrl.replace('rtmp://', 'rtmps://').replace(':5222', ':443');
  const displayRtmpUrl = useSecure ? rtmpUrlSecure : rtmpUrlInsecure;

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
    const allCreds = `RTMP URL: ${displayRtmpUrl}\nStream Key: ${streamKey}\nHLS Playback URL: ${hlsPlaybackUrl}`;
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
        <Alert>
          <AlertDescription className="text-xs sm:text-sm">
            <strong>Connection Issues?</strong> Try using standard RTMP first. Some OBS versions have trouble with secure RTMPS connections.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label className="text-sm sm:text-base">Connection Type</Label>
          <RadioGroup 
            value={useSecure ? "secure" : "standard"} 
            onValueChange={(val) => setUseSecure(val === "secure")} 
            className="space-y-2"
          >
            <div className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="standard" id="standard" />
              <div className="flex-1">
                <Label htmlFor="standard" className="font-medium cursor-pointer flex items-center gap-2">
                  <ShieldOff className="h-4 w-4" />
                  Standard RTMP (Recommended)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  More compatible with OBS and most streaming software (Port 5222)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="secure" id="secure" />
              <div className="flex-1">
                <Label htmlFor="secure" className="font-medium cursor-pointer flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Secure RTMPS
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Encrypted connection - may not work with all OBS versions (Port 443)
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rtmpUrl" className="text-sm sm:text-base">Server URL</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="rtmpUrl"
              value={displayRtmpUrl}
              readOnly
              className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'} min-h-[44px]`}
            />
            <Button
              variant="outline"
              size={isMobile ? "default" : "icon"}
              onClick={() => copyToClipboard(displayRtmpUrl, 'url')}
              className={isMobile ? "w-full sm:w-auto justify-center min-h-[44px]" : ""}
            >
              {copiedUrl ? (
                <>
                  <Check className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                  {isMobile && "Copied"}
                </>
              ) : (
                <>
                  <Copy className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                  {isMobile && "Copy"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="streamKey" className="text-sm sm:text-base">Stream Key</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Input
                id="streamKey"
                value={maskedKey}
                readOnly
                type={showKey ? "text" : "password"}
                className={`font-mono ${isMobile ? 'text-sm' : 'text-xs'} min-h-[44px]`}
              />
              <Button
                variant="outline"
                size={isMobile ? "default" : "icon"}
                onClick={() => setShowKey(!showKey)}
                className={isMobile ? "shrink-0" : ""}
              >
                {showKey ? (
                  <>
                    <EyeOff className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                    {isMobile && "Hide"}
                  </>
                ) : (
                  <>
                    <Eye className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                    {isMobile && "Show"}
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size={isMobile ? "default" : "icon"}
              onClick={() => copyToClipboard(streamKey, 'key')}
              className={isMobile ? "w-full sm:w-auto justify-center min-h-[44px]" : ""}
            >
              {copiedKey ? (
                <>
                  <Check className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                  {isMobile && "Copied"}
                </>
              ) : (
                <>
                  <Copy className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                  {isMobile && "Copy"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hlsUrl" className="text-sm sm:text-base">HLS Playback URL (for viewing)</Label>
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
              {copiedHls ? (
                <>
                  <Check className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                  {isMobile && "Copied"}
                </>
              ) : (
                <>
                  <Copy className={`${isMobile ? 'mr-2' : ''} h-4 w-4`} />
                  {isMobile && "Copy"}
                </>
              )}
            </Button>
          </div>
        </div>

        {!isMobile && (
          <div className="pt-2">
            <Button 
              onClick={copyAllCredentials}
              variant="default"
              className="w-full"
            >
              {copiedAll ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy All Credentials
            </Button>
          </div>
        )}

        <div className="pt-2">
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="desktop" className="gap-2">
                <Monitor className="h-4 w-4" />
                Desktop (OBS)
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile Apps
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="desktop" className="space-y-3 mt-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">OBS Studio Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open OBS Studio</li>
                  <li>Go to Settings → Stream</li>
                  <li>Service: Custom</li>
                  <li>Paste the Server URL above</li>
                  <li>Paste the Stream Key above</li>
                  <li>Click OK, then Start Streaming</li>
                </ol>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Tip:</strong> Start with standard RTMP. If that doesn't work, try secure RTMPS.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="mobile" className="space-y-3 mt-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    Recommended Mobile Apps:
                  </h4>
                  <ul className="mt-2 space-y-2">
                    <li className="text-sm">
                      <strong>Larix Broadcaster</strong> (iOS/Android)
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 ml-2"
                        onClick={() => window.open('https://softvelum.com/larix/', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </li>
                    <li className="text-sm">
                      <strong>Streamlabs</strong> (iOS/Android)
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 ml-2"
                        onClick={() => window.open('https://streamlabs.com/mobile-app', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </li>
                    <li className="text-sm">
                      <strong>Prism Live Studio</strong> (iOS/Android)
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 ml-2"
                        onClick={() => window.open('https://prismlive.com/', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </li>
                  </ul>
                </div>
                <Alert>
                  <AlertDescription className="text-xs">
                    Each app has slightly different settings. Look for "Custom RTMP" or "RTMP Stream" options and paste your credentials.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
