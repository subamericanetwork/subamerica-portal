import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { StreamStatusIndicator } from "@/components/StreamStatusIndicator";
import { Radio, Eye, Clock, Zap, ExternalLink, Square } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Stream {
  id: string;
  title: string;
  status: string;
  started_at: string | null;
  scheduled_start: string | null;
  viewer_count: number | null;
  hls_playback_url: string | null;
}

interface StreamManagerProps {
  artistId: string;
  onStreamClick?: (stream: Stream) => void;
  showActions?: boolean;
}

export const StreamManager = ({ artistId, onStreamClick, showActions = true }: StreamManagerProps) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [forcingLive, setForcingLive] = useState<string | null>(null);
  const [endingStream, setEndingStream] = useState<string | null>(null);
  const [streamToEnd, setStreamToEnd] = useState<Stream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStreams();
    
    // Subscribe to real-time stream updates
    const channel = supabase
      .channel('stream-manager')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artist_live_streams',
          filter: `artist_id=eq.${artistId}`
        },
        () => {
          loadStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId]);

  const loadStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_live_streams')
        .select('*')
        .eq('artist_id', artistId)
        .in('status', ['scheduled', 'waiting', 'live'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLive = async (streamId: string) => {
    setForcingLive(streamId);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .update({ 
          status: 'live',
          started_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;
      toast.success('Stream forced to live status');
    } catch (error) {
      console.error('Error forcing stream live:', error);
      toast.error('Failed to update stream status');
    } finally {
      setForcingLive(null);
    }
  };

  const handleWatch = (stream: Stream) => {
    navigate(`/watch-live/${stream.id}`);
  };

  const handleEndStream = async () => {
    if (!streamToEnd) return;
    
    setEndingStream(streamToEnd.id);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', streamToEnd.id);

      if (error) throw error;
      toast.success('Stream ended successfully');
      setStreamToEnd(null);
    } catch (error) {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    } finally {
      setEndingStream(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading streams...</p>
        </CardContent>
      </Card>
    );
  }

  if (streams.length === 0) {
    return null;
  }

  const liveStreams = streams.filter(s => s.status === 'live');
  const scheduledStreams = streams.filter(s => s.status === 'scheduled' || s.status === 'waiting');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Your Streams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveStreams.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-500 animate-pulse" />
              Live Now ({liveStreams.length})
            </h3>
            {liveStreams.map((stream) => (
              <div key={stream.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{stream.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StreamStatusIndicator status="live" />
                      {stream.viewer_count !== null && (
                        <Badge variant="secondary" className="gap-1">
                          <Eye className="h-3 w-3" />
                          {stream.viewer_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {showActions && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleWatch(stream)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Watch
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setStreamToEnd(stream)}
                        disabled={endingStream === stream.id}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        End Stream
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {scheduledStreams.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled/Waiting ({scheduledStreams.length})
            </h3>
            {scheduledStreams.map((stream) => (
              <div key={stream.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{stream.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StreamStatusIndicator status={stream.status === 'scheduled' ? 'waiting' : 'waiting'} />
                    </div>
                  </div>
                  {showActions && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleForceLive(stream.id)}
                        disabled={forcingLive === stream.id}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Force Live
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleWatch(stream)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showActions && (
          <Button className="w-full" onClick={() => navigate('/streaming')}>
            <Radio className="h-4 w-4 mr-2" />
            Manage All Streams
          </Button>
        )}
      </CardContent>

      <AlertDialog open={!!streamToEnd} onOpenChange={(open) => !open && setStreamToEnd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end "{streamToEnd?.title}"? This will stop the stream immediately and viewers will no longer be able to watch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndStream} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
