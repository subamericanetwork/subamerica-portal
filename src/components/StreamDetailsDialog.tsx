import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Clock, Eye, EyeOff, Copy, ExternalLink, Square } from "lucide-react";
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
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-2xl">{stream.title}</DialogTitle>
              <Badge variant={getStatusColor(stream.status)}>
                {stream.status}
              </Badge>
            </div>
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
