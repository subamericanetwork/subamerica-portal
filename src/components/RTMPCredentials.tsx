import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RTMPCredentialsProps {
  rtmpUrl: string;
  streamKey: string;
  hlsPlaybackUrl: string;
}

export const RTMPCredentials = ({ rtmpUrl, streamKey, hlsPlaybackUrl }: RTMPCredentialsProps) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHls, setCopiedHls] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: 'url' | 'key' | 'hls') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedHls(true);
        setTimeout(() => setCopiedHls(false), 2000);
      }

      toast({
        title: "Copied!",
        description: `${type === 'url' ? 'RTMP URL' : type === 'key' ? 'Stream Key' : 'HLS URL'} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const maskedKey = showKey ? streamKey : '•'.repeat(Math.min(streamKey.length, 32));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Credentials</CardTitle>
        <CardDescription>
          Use these credentials in OBS, Streamlabs, or your streaming software
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rtmpUrl">RTMP Server URL</Label>
          <div className="flex gap-2">
            <Input
              id="rtmpUrl"
              value={rtmpUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(rtmpUrl, 'url')}
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="streamKey">Stream Key</Label>
          <div className="flex gap-2">
            <Input
              id="streamKey"
              value={maskedKey}
              readOnly
              type={showKey ? "text" : "password"}
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(streamKey, 'key')}
            >
              {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this private! Anyone with your stream key can stream to your channel.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hlsUrl">Playback URL (HLS)</Label>
          <div className="flex gap-2">
            <Input
              id="hlsUrl"
              value={hlsPlaybackUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(hlsPlaybackUrl, 'hls')}
            >
              {copiedHls ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this URL with viewers to watch your stream
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Quick Setup Guide:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open OBS Studio or your streaming software</li>
            <li>Go to Settings → Stream</li>
            <li>Service: Custom</li>
            <li>Paste the RTMP Server URL</li>
            <li>Paste the Stream Key</li>
            <li>Click "Start Streaming"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
