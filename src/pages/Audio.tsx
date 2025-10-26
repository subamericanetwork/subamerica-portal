import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistData } from "@/hooks/useArtistData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Upload, Pencil, Trash2, Star, Loader2, Info, Volume2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AudioPlayer } from "@/components/AudioPlayer";
import { extractThumbnailFromVideo } from "@/lib/thumbnailExtractor";

interface AudioTrack {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  thumb_url: string | null;
  duration: number | null;
  tags: string[] | null;
  is_featured: boolean;
  explicit: boolean;
  status: string;
}

export default function Audio() {
  const { user } = useAuth();
  const { artist, audioTracks: initialAudioTracks, loading: artistLoading } = useArtistData();
  
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [viewerDisplayName, setViewerDisplayName] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [explicit, setExplicit] = useState(false);

  useEffect(() => {
    if (initialAudioTracks) {
      setAudioTracks(initialAudioTracks);
    }
  }, [initialAudioTracks]);

  // Fetch viewer profile for tracking
  useEffect(() => {
    const fetchViewerProfile = async () => {
      if (!user?.id) {
        setViewerDisplayName('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching viewer profile:', error);
          return;
        }

        if (data?.display_name) {
          setViewerDisplayName(data.display_name);
          console.log('[Audio] Viewer display name loaded:', data.display_name);
        }
      } catch (error) {
        console.error('Error in fetchViewerProfile:', error);
      }
    };

    fetchViewerProfile();
  }, [user?.id]);

  const resetForm = () => {
    setAudioFile(null);
    setThumbnailFile(null);
    setTitle("");
    setDescription("");
    setTags("");
    setExplicit(false);
    setEditingTrack(null);
  };

  const handleEdit = (track: AudioTrack) => {
    setEditingTrack(track);
    setTitle(track.title);
    setDescription(track.description || "");
    setTags(track.tags?.join(", ") || "");
    setExplicit(track.explicit);
    setDialogOpen(true);
  };

  const extractAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audioElement = document.createElement('audio');
      audioElement.preload = 'metadata';
      
      audioElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audioElement.src);
        resolve(Math.floor(audioElement.duration));
      };
      
      audioElement.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
      };
      
      audioElement.src = URL.createObjectURL(file);
    });
  };

  const handleSubmitAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artist) return;

    // Check if we're editing or creating
    if (editingTrack && !audioFile) {
      // Just update metadata
      try {
        setUploading(true);
        const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        
        const { error } = await supabase
          .from("audio_tracks")
          .update({
            title,
            description: description || null,
            tags: tagsArray,
            explicit,
          })
          .eq("id", editingTrack.id);

        if (error) throw error;

        toast.success("Audio track updated!");
        setDialogOpen(false);
        resetForm();
        
        // Refresh data
        const { data } = await supabase
          .from("audio_tracks")
          .select("*")
          .eq("artist_id", artist.id)
          .order("created_at", { ascending: false });
        setAudioTracks(data || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    if (audioFile.size > 50 * 1024 * 1024) {
      toast.error("Audio file must be less than 50MB");
      return;
    }

    try {
      setUploading(true);

      // Extract duration from audio file
      const duration = await extractAudioDuration(audioFile);

      // Upload audio file
      const audioFileName = `${user.id}/${Date.now()}-${audioFile.name}`;
      const { error: audioUploadError } = await supabase.storage
        .from("audio-files")
        .upload(audioFileName, audioFile);

      if (audioUploadError) throw audioUploadError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from("audio-files")
        .getPublicUrl(audioFileName);

      // Upload thumbnail if provided
      let thumbUrl = null;
      if (thumbnailFile) {
        const thumbFileName = `${user.id}/thumbnails/${Date.now()}-${thumbnailFile.name}`;
        const { error: thumbUploadError } = await supabase.storage
          .from("audio-files")
          .upload(thumbFileName, thumbnailFile);

        if (thumbUploadError) throw thumbUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("audio-files")
          .getPublicUrl(thumbFileName);
        thumbUrl = publicUrl;
      }

      // Create tags array
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      // Insert audio track record
      const { error: insertError } = await supabase
        .from("audio_tracks")
        .insert({
          artist_id: artist.id,
          title,
          description: description || null,
          audio_url: audioUrl,
          thumb_url: thumbUrl,
          duration,
          tags: tagsArray,
          explicit,
          status: 'ready',
          published_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast.success("Audio track uploaded successfully!");
      setDialogOpen(false);
      resetForm();

      // Refresh audio tracks
      const { data } = await supabase
        .from("audio_tracks")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      setAudioTracks(data || []);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload audio");
    } finally {
      setUploading(false);
    }
  };

  const handleSetFeatured = async (trackId: string) => {
    if (!artist) return;

    try {
      // Unset all featured tracks
      await supabase
        .from("audio_tracks")
        .update({ is_featured: false })
        .eq("artist_id", artist.id);

      // Set this track as featured
      const { error } = await supabase
        .from("audio_tracks")
        .update({ is_featured: true })
        .eq("id", trackId);

      if (error) throw error;

      toast.success("Featured track updated!");

      // Refresh data
      const { data } = await supabase
        .from("audio_tracks")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      setAudioTracks(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this audio track?")) return;
    if (!artist) return;

    try {
      const { error } = await supabase
        .from("audio_tracks")
        .delete()
        .eq("id", trackId);

      if (error) throw error;

      toast.success("Audio track deleted!");

      // Refresh data
      const { data } = await supabase
        .from("audio_tracks")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      setAudioTracks(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (artistLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Audio Library</h1>
            <p className="text-muted-foreground">Manage your audio tracks</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Audio
          </Button>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Upload audio files (MP3, WAV, M4A, FLAC) up to 50MB</li>
              <li>Mark one track as featured to highlight it on your port</li>
              <li>Audio tracks appear in the catalog and can be added to playlists</li>
              <li>Free tier: 20 tracks max</li>
            </ul>
          </AlertDescription>
        </Alert>

        {audioTracks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Music className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No audio tracks yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first audio track to get started
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {audioTracks.map((track) => (
              <Card key={track.id}>
                <CardHeader>
                  <div className="relative">
                    {track.thumb_url ? (
                      <img
                        src={track.thumb_url}
                        alt={track.title}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                        <Music className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {track.is_featured && (
                      <Badge className="absolute top-2 right-2 gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <CardTitle className="text-lg mb-1">{track.title}</CardTitle>
                    {track.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {track.description}
                      </p>
                    )}
                  </div>

                  {track.audio_url && (
                    <AudioPlayer 
                      audioUrl={track.audio_url}
                      title={track.title}
                      contentId={track.id}
                      artistName={artist?.display_name || 'Unknown'}
                      viewerName={viewerDisplayName || undefined}
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatDuration(track.duration)}</Badge>
                    {track.explicit && <Badge variant="destructive">Explicit</Badge>}
                    {track.tags?.map(tag => (
                      <Badge key={tag} variant="outline">#{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetFeatured(track.id)}
                      disabled={track.is_featured}
                      className="flex-1"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      {track.is_featured ? 'Featured' : 'Set Featured'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(track)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(track.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTrack ? 'Edit Audio Track' : 'Upload Audio Track'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAudio} className="space-y-4">
              {!editingTrack && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="audio-file">Audio File *</Label>
                    <Input
                      id="audio-file"
                      type="file"
                      accept=".mp3,.wav,.m4a,.flac,.ogg"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP3, WAV, M4A, FLAC, OGG (Max 50MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail-file">Cover Art (Optional)</Label>
                    <Input
                      id="thumbnail-file"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG or PNG (Max 5MB)
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Track title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of the track"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="hip-hop, rap, underground (comma-separated)"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="explicit"
                  checked={explicit}
                  onCheckedChange={(checked) => setExplicit(checked as boolean)}
                />
                <Label htmlFor="explicit" className="cursor-pointer">
                  Explicit content
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={uploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading} className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingTrack ? 'Updating...' : 'Uploading...'}
                    </>
                  ) : (
                    editingTrack ? 'Update' : 'Upload'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
