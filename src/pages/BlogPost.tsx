import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BlogCommentList } from "@/components/BlogCommentList";

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
  published_at: string;
  view_count: number;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      // Fetch the blog post
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("publish_status", "published")
        .not("published_at", "is", null)
        .single();

      if (error) throw error;
      
      setPost(data);

      // Increment view count
      await supabase
        .from("blog_posts")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id);

      // Fetch related posts in same category
      const { data: related } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, excerpt, featured_image, author_name, category, tags, published_at, view_count")
        .eq("publish_status", "published")
        .eq("category", data.category)
        .not("published_at", "is", null)
        .neq("id", data.id)
        .order("published_at", { ascending: false })
        .limit(3);

      setRelatedPosts(related || []);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      toast.error("Failed to load blog post");
      navigate("/blog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ConditionalHeader />
        <main className="pt-[80px] pb-20">
          <div className="container max-w-4xl mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-96 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background">
      <ConditionalHeader />
      
      <main className="pt-[80px] pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/blog")}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          {/* Article Header */}
          <article className="prose prose-invert max-w-none">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4">{post.category}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{post.author_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count} views</span>
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="text-foreground whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          </article>

          {/* Comments Section */}
          <BlogCommentList postId={post.id} />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(related => (
                  <div
                    key={related.id}
                    className="group cursor-pointer bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
                    onClick={() => navigate(`/blog/${related.slug}`)}
                  >
                    {related.featured_image && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={related.featured_image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {related.category}
                      </Badge>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
