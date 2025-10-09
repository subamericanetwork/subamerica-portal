import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Star, Clock, CheckCircle, PlayCircle, Trash2 } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Videos = () => {
  const { artist, videos, loading } = useArtistData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    kind: "music_video",
    tags: "",
  });

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist) return;

    setIsSubmitting(true);

    const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

    const { error } = await supabase
      .from("videos")
      .insert({
        artist_id: artist.id,
        title: formData.title,
        kind: formData.kind as any,
        tags,
        status: "ready" as any,
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Video added successfully!");
      setFormData({ title: "", kind: "music_video", tags: "" });
      setIsDialogOpen(false);
      window.location.reload();
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
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Library</h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and set your featured content
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Video</DialogTitle>
                <DialogDescription>
                  Add a new video to your library
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVideo} className="space-y-4">
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
                    {isSubmitting ? "Adding..." : "Add Video"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Featured video must have captions for accessibility</p>
              <p>• Only one video can be featured at a time</p>
              <p>• Featured video appears at the top of your Port</p>
            </div>
          </CardContent>
        </Card>

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
                    <div className="w-40 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="h-8 w-8 text-muted-foreground" />
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

                      <div className="mt-4 flex items-center gap-3">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Videos;
