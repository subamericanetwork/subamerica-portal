import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { Save, Trash2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Hls from "hls.js";

interface EndedStreamCardProps {
  stream: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    ended_at: string | null;
    duration_minutes: number | null;
    cloudinary_vod_url: string | null;
    cloudinary_public_id: string | null;
    converted_to_track: boolean | null;
    converted_track_id: string | null;
  };
  onDeleted: () => void;
}

export function EndedStreamCard({ stream, onDeleted }: EndedStreamCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!stream.cloudinary_vod_url || !videoRef.current) return;

    const video = videoRef.current;
    const videoSrc = stream.cloudinary_vod_url;

    // Check if it's an HLS stream
    if (videoSrc.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hls.loadSource(videoSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS error:', data);
            toast.error('Error loading video');
          }
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
      }
    } else {
      video.src = videoSrc;
    }
  }, [stream.cloudinary_vod_url]);

  const handleSaveToLibrary = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-stream-to-track', {
        body: {
          stream_id: stream.id,
          track_title: stream.title,
          track_description: stream.description,
          thumbnail_url: stream.thumbnail_url,
          media_type: 'video'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Recording saved to your video library!', {
          action: {
            label: 'View',
            onClick: () => navigate(data.track_url)
          }
        });
        // Reload to update the UI
        window.location.reload();
      } else {
        throw new Error(data?.error || 'Failed to save recording');
      }
    } catch (error) {
      console.error('Error saving to library:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save recording');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('artist_live_streams')
        .delete()
        .eq('id', stream.id);

      if (error) throw error;

      toast.success('Stream recording deleted');
      setShowDeleteDialog(false);
      onDeleted();
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast.error('Failed to delete recording');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getRecordingStatus = () => {
    if (stream.converted_to_track) {
      return <Badge className="bg-green-500">✅ Saved to Library</Badge>;
    }
    if (stream.cloudinary_vod_url) {
      return <Badge className="bg-blue-500">🎬 Recording Ready</Badge>;
    }
    return <Badge variant="secondary">🔴 Recording Processing...</Badge>;
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{stream.title}</h4>
              {stream.description && (
                <p className="text-sm text-muted-foreground mt-1">{stream.description}</p>
              )}
            </div>
            {getRecordingStatus()}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {stream.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {stream.duration_minutes} minutes
              </div>
            )}
            {stream.ended_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(stream.ended_at)}
              </div>
            )}
          </div>
        </div>

        {stream.cloudinary_vod_url ? (
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              playsInline
              poster={stream.thumbnail_url || undefined}
            />
          </div>
        ) : (
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-pulse">🔄</div>
              <p className="text-sm text-muted-foreground">Recording is being processed...</p>
              <p className="text-xs text-muted-foreground">This usually takes a few minutes</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSaveToLibrary}
            disabled={saving || !stream.cloudinary_vod_url || stream.converted_to_track === true}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : stream.converted_to_track ? 'Already Saved' : 'Save to Library'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stream Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{stream.title}"? This will permanently remove the recording.
              {stream.converted_to_track && " The video in your library will not be affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
