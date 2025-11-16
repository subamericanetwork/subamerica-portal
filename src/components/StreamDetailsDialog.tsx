import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Users, Clock, Eye, EyeOff, Copy, ExternalLink, Square, AlertCircle, RefreshCw, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Stream {
  id: string;
  title: string;
  status: string;
  started_at: string | null;
  scheduled_start: string | null;
  viewer_count: number | null;
  hls_playback_url: string | null;
  rtmp_ingest_url: string;
  stream_key: string;
  description: string | null;
  thumbnail_url: string | null;
}

interface StreamDetailsDialogProps {
  stream: Stream | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStreamUpdated?: () => void;
}

export function StreamDetailsDialog({ 
  stream, 
  open, 
  onOpenChange,
  onStreamUpdated 
}: StreamDetailsDialogProps) {
  const { toast } = useToast();
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [showRtmpUrl, setShowRtmpUrl] = useState(false);
  const [showHlsUrl, setShowHlsUrl] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'waiting' | 'connected' | 'disconnected'>('checking');

  // Check connection status based on stream status
  useEffect(() => {
    if (!stream) return;
    
    if (stream.status === 'live') {
      setConnectionStatus('connected');
    } else if (stream.status === 'waiting' || stream.status === 'scheduled') {
      setConnectionStatus('waiting');
    } else if (stream.status === 'ended') {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('checking');
    }
  }, [stream?.status]);

  if (!stream) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const copyAllCredentials = async () => {
    const credentials = `Stream Title: ${stream.title}
RTMP URL: ${stream.rtmp_ingest_url}
Stream Key: ${stream.stream_key}
HLS Playback URL: ${stream.hls_playback_url || "Not available yet"}`;

    await copyToClipboard(credentials, "All credentials");
  };

  const handleEndStream = async () => {
    setIsEnding(true);
    try {
      const { error } = await supabase
        .from("artist_live_streams")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", stream.id);

      if (error) throw error;

      toast({
        title: "Stream ended",
        description: "Your live stream has been ended successfully",
      });
      onStreamUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error ending stream:", error);
      toast({
        title: "Error",
        description: "Failed to end stream. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
      setShowEndDialog(false);
    }
  };

  const handleWatch = () => {
    if (stream.hls_playback_url) {
      window.open(`/watch-live/${stream.id}`, "_blank");
    }
  };

  const handleSyncStatus = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stream-status', {
        body: { streamId: stream.id }
      });

      if (error) throw error;

      toast({
        title: "Status synced",
        description: "Stream status updated from Mux",
      });
      onStreamUpdated?.();
    } catch (error) {
      console.error('Error syncing stream status:', error);
      toast({
        title: "Error",
        description: "Failed to sync stream status",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "destructive";
      case "scheduled":
        return "secondary";
      case "waiting":
        return "default";
      default:
        return "outline";
    }
  };

  const maskText = (text: string, show: boolean) => {
    if (show) return text;
    return "•".repeat(Math.min(text.length, 20));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex-1">{stream.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(stream.status)}>
                  {stream.status.toUpperCase()}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSyncStatus}
                  disabled={syncing}
                  title="Refresh status from Mux"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <DialogDescription>
              Stream details and RTMP credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stream Information */}
            <div className="space-y-3">
              {stream.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{stream.description}</p>
                </div>
              )}

              <div className="grid gap-3">
                {stream.scheduled_start && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span>{format(new Date(stream.scheduled_start), "PPp")}</span>
                  </div>
                )}

                {stream.started_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span>{format(new Date(stream.started_at), "PPp")}</span>
                  </div>
                )}

                {stream.status === "live" && stream.viewer_count !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Viewers:</span>
                    <span className="font-medium">{stream.viewer_count}</span>
                  </div>
                )}
              </div>
            </div>

        <Separator />

        {/* Connection Status */}
        {connectionStatus === 'waiting' && (
          <Alert>
            <Radio className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              <strong>Waiting for OBS connection...</strong>
              <p className="mt-1 text-sm text-muted-foreground">Your stream is ready. Connect OBS using the credentials below to go live.</p>
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'connected' && (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/50">
            <Radio className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Connected! Stream is live</strong>
              <p className="mt-1 text-sm">Your stream is broadcasting successfully.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* OBS Setup Instructions */}
        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            How to Connect OBS
          </h3>
          <ol className="space-y-2 text-sm">
            <li><strong>1.</strong> Open OBS → <strong>Settings</strong> → <strong>Stream</strong></li>
            <li><strong>2.</strong> Service: Select <strong>"Custom..."</strong></li>
            <li><strong>3.</strong> Server: Copy the <strong>RTMP URL</strong> below</li>
            <li><strong>4.</strong> Stream Key: Copy the <strong>Stream Key</strong> below</li>
            <li><strong>5.</strong> Click <strong>"OK"</strong> then <strong>"Start Streaming"</strong></li>
          </ol>
          <p className="text-xs text-muted-foreground">
            💡 Use RTMP (port 5222) for standard connection or RTMPS (port 443) if port 5222 is blocked.
          </p>
        </div>

        <Separator />

        {/* RTMP Credentials */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">RTMP Credentials</h3>
              
              {/* RTMP URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">RTMP Ingest URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {maskText(stream.rtmp_ingest_url, showRtmpUrl)}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowRtmpUrl(!showRtmpUrl)}
                  >
                    {showRtmpUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(stream.rtmp_ingest_url, "RTMP URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Stream Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stream Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {maskText(stream.stream_key, showStreamKey)}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowStreamKey(!showStreamKey)}
                  >
                    {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(stream.stream_key, "Stream Key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* HLS Playback URL */}
              {stream.hls_playback_url && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">HLS Playback URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {maskText(stream.hls_playback_url, showHlsUrl)}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowHlsUrl(!showHlsUrl)}
                    >
                      {showHlsUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(stream.hls_playback_url!, "HLS URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={copyAllCredentials}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Credentials
              </Button>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {stream.status === "live" && stream.hls_playback_url && (
                <Button onClick={handleWatch} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Stream
                </Button>
              )}
              
              {stream.status === "live" && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowEndDialog(true)}
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Stream
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Stream Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the stream and mark it as ended. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndStream}
              disabled={isEnding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isEnding ? "Ending..." : "End Stream"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
