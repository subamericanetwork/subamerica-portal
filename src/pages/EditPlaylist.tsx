import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaylist } from '@/hooks/usePlaylist';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Video {
  id: string;
  title: string;
}

const EditPlaylist = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, loading: playlistsLoading, updatePlaylist, removeVideoFromPlaylist } = usePlaylist();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [videoToRemove, setVideoToRemove] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!id) {
        navigate('/member/playlists');
        return;
      }

      // Wait for playlists to finish loading
      if (playlistsLoading) {
        return;
      }

      // Now that playlists are loaded, check if our playlist exists
      const currentPlaylist = playlists.find(p => p.id === id);
      
      if (!currentPlaylist) {
        toast({
          title: "Error",
          description: "Playlist not found",
          variant: "destructive",
        });
        navigate('/member/playlists');
        return;
      }

      // Only initialize once
      if (initialized) return;
      setInitialized(true);

      // Set form data
      setName(currentPlaylist.name);
      setDescription(currentPlaylist.description || '');
      setIsPublic(currentPlaylist.is_public);

      // Fetch video details
      if (currentPlaylist.video_ids.length > 0) {
        setVideosLoading(true);
        try {
          const { data, error } = await supabase
            .from('videos')
            .select('id, title')
            .in('id', currentPlaylist.video_ids);

          if (error) throw error;

          // Maintain the order from video_ids
          const orderedVideos = currentPlaylist.video_ids
            .map(videoId => data?.find(v => v.id === videoId))
            .filter(Boolean) as Video[];

          setVideos(orderedVideos);
        } catch (error) {
          console.error('Error fetching videos:', error);
          toast({
            title: "Error",
            description: "Failed to load videos",
            variant: "destructive",
          });
        } finally {
          setVideosLoading(false);
        }
      }
    };

    loadPlaylistData();
  }, [id, playlists, playlistsLoading, navigate, toast, initialized]);

  const handleSave = async () => {
    if (!id || !name.trim()) {
      toast({
        title: "Error",
        description: "Playlist name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updatePlaylist(id, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      navigate('/member/playlists');
    } catch (error) {
      console.error('Error saving playlist:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!id) return;
    
    try {
      await removeVideoFromPlaylist(id, videoId);
      setVideos(videos.filter(v => v.id !== videoId));
      setVideoToRemove(null);
    } catch (error) {
      console.error('Error removing video:', error);
    }
  };

  // Show loading while playlists are being fetched
  if (playlistsLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/member/playlists')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Playlists
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Edit Playlist</h1>
            <p className="text-muted-foreground mt-2">
              Update playlist details and manage videos
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Playlist Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter playlist name"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="public">Public Playlist</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this playlist visible to others
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-4">
              Videos ({videos.length})
            </h2>
            {videos.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No videos in this playlist yet
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {videos.map((video) => (
                  <Card key={video.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{video.title}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setVideoToRemove(video.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/member/playlists')}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!videoToRemove} onOpenChange={() => setVideoToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this video from the playlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => videoToRemove && handleRemoveVideo(videoToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditPlaylist;
