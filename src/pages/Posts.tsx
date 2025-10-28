import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Image as ImageIcon, Video as VideoIcon, Trash2, Pencil, Eye } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isImageFile, isVideoFile, validateImageSize } from "@/lib/videoValidation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ArtistPost {
  id: string;
  title: string;
  caption: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  publish_status: 'draft' | 'published' | 'archived';
  display_order: number;
  created_at: string;
}

const Posts = () => {
  const { artist, loading } = useArtistData();
  const [posts, setPosts] = useState<ArtistPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<ArtistPost | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    publish_status: "draft" as "draft" | "published" | "archived",
    display_order: 0,
  });

  useEffect(() => {
    if (artist) {
      fetchPosts();
    }
  }, [artist]);

  const fetchPosts = async () => {
    if (!artist) return;

    const { data, error } = await supabase
      .from("artist_posts")
      .select("*")
      .eq("artist_id", artist.id)
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to fetch posts");
      console.error(error);
      return;
    }

    setPosts(data || []);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      caption: "",
      publish_status: "draft",
      display_order: posts.length,
    });
    setMediaFile(null);
    setEditingPost(null);
  };

  const handleEdit = (post: ArtistPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      caption: post.caption || "",
      publish_status: post.publish_status,
      display_order: post.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file) && !isVideoFile(file)) {
      toast.error("Please upload an image (JPG, PNG, WebP) or video (MP4, WebM)");
      return;
    }

    if (isImageFile(file) && !validateImageSize(file)) {
      toast.error("Image must be under 5MB");
      return;
    }

    if (isVideoFile(file) && file.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }

    setMediaFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist) return;

    if (!editingPost && !mediaFile) {
      toast.error("Please select a media file");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = editingPost?.media_url || "";
      let mediaType: 'image' | 'video' = editingPost?.media_type || 'image';

      // Upload new media if provided
      if (mediaFile) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("User not authenticated");
          setIsSubmitting(false);
          return;
        }

        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${artist.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, mediaFile);

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
        mediaType = isVideoFile(mediaFile) ? 'video' : 'image';
      }

      const postData = {
        artist_id: artist.id,
        title: formData.title,
        caption: formData.caption || null,
        media_url: mediaUrl,
        media_type: mediaType,
        publish_status: formData.publish_status,
        display_order: formData.display_order,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("artist_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast.success("Post updated successfully");
      } else {
        const { error } = await supabase
          .from("artist_posts")
          .insert([postData]);

        if (error) throw error;
        toast.success("Post created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save post");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePostId) return;

    try {
      const { error } = await supabase
        .from("artist_posts")
        .delete()
        .eq("id", deletePostId);

      if (error) throw error;

      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
      console.error(error);
    } finally {
      setDeletePostId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Posts</h1>
            <p className="text-muted-foreground mt-2">
              Manage featured posts that appear on your Portals feed
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Optional description or caption"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="media">Media {!editingPost && "*"}</Label>
                  <Input
                    id="media"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    onChange={handleFileChange}
                    required={!editingPost}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Images: JPG, PNG, WebP (max 5MB) | Videos: MP4, WebM (max 100MB)
                  </p>
                  {editingPost && !mediaFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to keep current media
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.publish_status}
                    onValueChange={(value: "draft" | "published" | "archived") =>
                      setFormData({ ...formData, publish_status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first featured post to appear on the Portals feed
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Post
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {post.media_type === 'image' ? (
                      <img
                        src={post.media_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={post.media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={post.publish_status === 'published' ? 'default' : 'secondary'}>
                        {post.publish_status}
                      </Badge>
                    </div>
                    {post.media_type === 'video' && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                          <VideoIcon className="h-3 w-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                      {post.caption && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.caption}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleEdit(post)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletePostId(post.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Posts;
