import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, Upload, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BlogCommentModeration } from "@/components/BlogCommentModeration";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  category: string;
  tags: string[];
  publish_status: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
}

const categories = ["News", "Artist Spotlight", "Industry", "Tutorial", "Behind the Scenes"];

export default function AdminBlog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image: "",
    category: "News",
    tags: "",
    publish_status: "draft",
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const postData = {
        ...formData,
        author_name: user?.email || "Admin",
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        published_at: formData.publish_status === "published" ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast.success("Blog post updated successfully");
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert([postData]);

        if (error) throw error;
        toast.success("Blog post created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error(error.message || "Failed to save blog post");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, featured_image: publicUrl });
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, featured_image: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      featured_image: post.featured_image || "",
      category: post.category,
      tags: post.tags.join(", "),
      publish_status: post.publish_status,
    });
    setImagePreview(post.featured_image || null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Blog post deleted");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete blog post");
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image: "",
      category: "News",
      tags: "",
      publish_status: "draft",
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">Blog Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="bg-card border border-border rounded-lg">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : posts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No blog posts yet. Create your first post!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {posts.map(post => (
                    <div key={post.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold truncate">{post.title}</h3>
                            <Badge variant={post.publish_status === "published" ? "default" : "secondary"}>
                              {post.publish_status}
                            </Badge>
                            <Badge variant="outline">{post.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt || post.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.view_count} views
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(post)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comment Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <BlogCommentModeration />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit" : "Create"} Blog Post</DialogTitle>
              <DialogDescription>
                {editingPost ? "Update your blog post" : "Create a new blog post"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Short summary for the listing page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                
                {/* Image Preview */}
                {(imagePreview || formData.featured_image) && (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={imagePreview || formData.featured_image}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Optional URL Input */}
                <div className="relative">
                  <Input
                    id="featured_image"
                    type="url"
                    placeholder="Or paste image URL"
                    value={formData.featured_image}
                    onChange={(e) => {
                      setFormData({ ...formData, featured_image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image (max 5MB) or paste a URL
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publish_status">Status</Label>
                  <Select
                    value={formData.publish_status}
                    onValueChange={(value) => setFormData({ ...formData, publish_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="music, indie, underground"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPost ? "Update" : "Create"} Post
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
