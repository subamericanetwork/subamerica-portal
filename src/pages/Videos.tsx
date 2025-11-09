import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Star, Clock, CheckCircle, PlayCircle, Trash2, Pencil, Info, Scissors } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LivepushVideoSync } from "@/components/LivepushVideoSync";
import { extractThumbnailFromVideo } from "@/lib/thumbnailExtractor";
import { VideoThumbnailGenerator } from "@/components/VideoThumbnailGenerator";
import { SubClipGenerator } from "@/components/SubClipGenerator";

const Videos = () => {
  const { artist, videos, loading } = useArtistData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    kind: "music_video",
    tags: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideoForSubClip, setSelectedVideoForSubClip] = useState<any>(null);

  const resetForm = () => {
    setFormData({ title: "", kind: "music_video", tags: "" });
    setVideoFile(null);
    setUploadProgress(0);
    setEditingVideo(null);
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      kind: video.kind,
      tags: video.tags?.join(', ') || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!artist) {
      console.error('[Videos] No artist data available');
      toast.error("Artist data not loaded");
      return;
    }

    // Refresh session to ensure auth context is current
    console.log('[Videos] Refreshing session before upload...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('[Videos] Session refresh failed:', sessionError);
      toast.error("Session expired. Please refresh the page and try again.");
      return;
    }
    console.log('[Videos] Session valid, user ID:', session.user.id);

    // Re-verify artist ownership
    const { data: verifiedArtist, error: artistError } = await supabase
      .from('artists')
      .select('id, user_id')
      .eq('user_id', session.user.id)
      .single();

    if (artistError || !verifiedArtist) {
      console.error('[Videos] Artist verification failed:', artistError);
      toast.error("Artist profile not found. Please contact support.");
      return;
    }
    console.log('[Videos] Artist verified:', verifiedArtist);

    // Check video limit for new videos
    if (!editingVideo && videos.length >= 10) {
      toast.error("Maximum of 10 videos allowed per artist");
      return;
    }

    if (!editingVideo && !videoFile) {
      toast.error("Please select a video file");
      return;
    }

    setIsSubmitting(true);

    try {
      let videoUrl = editingVideo?.video_url;
      
      // Only upload if there's a new file
      if (videoFile) {
        console.log('[Videos] Starting video file upload...');
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('[Videos] STORAGE ERROR - Video upload failed:', uploadError);
          toast.error(`Storage error: ${uploadError.message}. Check videos bucket RLS policy.`);
          setIsSubmitting(false);
          return;
        }
        console.log('[Videos] Video file uploaded successfully');

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);

        videoUrl = publicUrl;
      }

      let thumbnailUrl = editingVideo?.thumb_url || null;

      // Generate thumbnail from the uploaded video
      if (videoFile) {
        try {
          console.log('[Videos] Generating thumbnail...');
          // Extract thumbnail at 2-second mark
          const thumbnailBlob = await extractThumbnailFromVideo(videoFile, 2);
          
          // Upload thumbnail to storage - path must match RLS policy: user_id/thumbnails/...
          const thumbnailFileName = `${session.user.id}/thumbnails/${Date.now()}.jpg`;
          const { error: thumbUploadError } = await supabase.storage
            .from('videos')
            .upload(thumbnailFileName, thumbnailBlob, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });

          if (!thumbUploadError) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(thumbnailFileName);
            
            thumbnailUrl = thumbUrl;
            console.log('[Videos] Thumbnail generated and uploaded successfully');
          } else {
            console.error('[Videos] STORAGE ERROR - Thumbnail upload failed:', thumbUploadError);
            throw new Error(`Thumbnail storage error: ${thumbUploadError.message}`);
          }
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
          // Don't fail the entire upload if thumbnail generation fails
        }
      }

      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      console.log('[Videos] Inserting video record into database...');
      const videoData = {
        artist_id: verifiedArtist.id,
        title: formData.title,
        kind: formData.kind as any,
        tags,
        status: "ready" as any,
        video_url: videoUrl,
        thumb_url: thumbnailUrl,
        published_at: new Date().toISOString(),
      };

      let error;
      let result;
      if (editingVideo) {
        result = await supabase
          .from("videos")
          .update(videoData)
          .eq("id", editingVideo.id)
          .select();
        error = result.error;
      } else {
        result = await supabase
          .from("videos")
          .insert(videoData)
          .select();
        error = result.error;
      }

      if (error) {
        console.error('[Videos] DATABASE ERROR - Insert/update failed:', error);
        console.error('[Videos] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error(`Database error: ${error.message}. This is likely an RLS policy issue.`);
      } else {
        console.log('[Videos] Video saved successfully:', result.data);
        toast.success(editingVideo ? "Video updated successfully!" : "Video uploaded successfully!");
        resetForm();
        setIsDialogOpen(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error(editingVideo ? "An error occurred during update" : "An error occurred during upload");
    }

    setIsSubmitting(false);
  };

  const handleSetFeatured = async (videoId: string, currentStatus: boolean) => {
    if (!artist) return;

    // First unfeatured all videos
    if (!currentStatus) {
      await supabase
        .from("videos")
        .update({ is_featured: false })
        .eq("artist_id", artist.id);
    }

    // Then set the selected one
    const { error } = await supabase
      .from("videos")
      .update({ is_featured: !currentStatus })
      .eq("id", videoId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentStatus ? "Removed from featured" : "Set as featured!");
      window.location.reload();
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Video deleted successfully!");
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TooltipProvider>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and set your featured content
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button type="button">
                <Upload className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Add Video"}</DialogTitle>
                <DialogDescription>
                  {editingVideo ? "Update video details" : "Upload a video (max 100MB). Supported formats: MP4, MOV, AVI, WebM"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitVideo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video">Video File (Max 100MB) {editingVideo && "(optional - leave blank to keep current)"}</Label>
                  <Input
                    id="video"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 104857600) {
                          toast.error("File size must be less than 100MB");
                          e.target.value = '';
                          return;
                        }
                        setVideoFile(file);
                      }
                    }}
                    required={!editingVideo}
                  />
                  {videoFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Lunar Static"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kind">Type</Label>
                  <Select value={formData.kind} onValueChange={(value) => setFormData({ ...formData, kind: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music_video">Music Video</SelectItem>
                      <SelectItem value="performance_clip">Performance</SelectItem>
                      <SelectItem value="poem">Poem</SelectItem>
                      <SelectItem value="short_film">Short Film</SelectItem>
                      <SelectItem value="audio_only">Audio Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="dream-pop, nocturne, warm"
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (editingVideo ? "Updating..." : "Adding...") 
                      : (editingVideo ? "Update Video" : "Add Video")
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Featured Video:</strong> Your featured video appears prominently at the top of your Port. Only 1 video can be featured, and it must have captions for accessibility.</p>
              <p><strong>Video Limit:</strong> Store up to 10 videos ({videos.length}/10 used). Choose quality content that best represents your work.</p>
              <p><strong>File Guidelines:</strong> Max 100MB per video. Recommended formats: MP4, MOV.</p>
            </div>
          </AlertDescription>
        </Alert>

        {videos.length === 0 ? (
          <Card className="gradient-card">
            <CardContent className="p-12 text-center">
              <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">Add your first video to get started</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="gradient-card">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-40 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {video.thumb_url ? (
                        <img 
                          src={video.thumb_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PlayCircle className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{video.title}</h3>
                            {video.is_featured && (
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                <Star className="h-3 w-3 mr-1 fill-primary" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{video.kind.replace('_', ' ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {video.status === "ready" ? (
                            <Badge variant="outline" className="border-green-500/50 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {video.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <LivepushVideoSync 
                          videoId={video.id} 
                          artistId={artist?.id || ''} 
                          videoTitle={video.title}
                        />
                        
                        <VideoThumbnailGenerator
                          videoId={video.id}
                          videoUrl={video.video_url}
                          currentThumbnail={video.thumb_url}
                          onThumbnailGenerated={(newUrl) => {
                            toast.success("Thumbnail regenerated!");
                            window.location.reload();
                          }}
                        />
                        
                        
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVideoForSubClip(video)}
                          >
                            <Scissors className="h-4 w-4 mr-2" />
                            Create SubClip
                          </Button>
                          {!video.is_featured && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetFeatured(video.id, video.is_featured)}
                            >
                              Set as Featured
                            </Button>
                          )}
                          {video.is_featured && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetFeatured(video.id, video.is_featured)}
                            >
                              Remove Featured
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(video)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(video.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </TooltipProvider>

      {/* SubClip Generator Dialog */}
      {selectedVideoForSubClip && artist && (
        <SubClipGenerator
          videoId={selectedVideoForSubClip.id}
          videoUrl={selectedVideoForSubClip.video_url}
          videoTitle={selectedVideoForSubClip.title}
          artistId={artist.id}
          artistSlug={artist.slug}
          onClipGenerated={(clip) => {
            toast.success('SubClip added to library!');
            setSelectedVideoForSubClip(null);
          }}
          onClose={() => setSelectedVideoForSubClip(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default Videos;
