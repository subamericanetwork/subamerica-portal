import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  moderation_status: string;
  is_spam: boolean;
  flagged_count: number;
  user_profiles?: {
    display_name: string;
  };
  blog_posts?: {
    title: string;
  };
}

export function BlogCommentModeration() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "flagged">("pending");

  const fetchComments = async () => {
    try {
      let query = supabase
        .from("blog_comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("moderation_status", "pending");
      } else if (filter === "flagged") {
        query = query.gt("flagged_count", 0);
      }

      const { data: commentsData, error: commentsError } = await query;
      if (commentsError) throw commentsError;

      // Fetch user profiles
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Fetch blog post titles
      const postIds = [...new Set(commentsData?.map(c => c.blog_post_id) || [])];
      const { data: postsData } = await supabase
        .from("blog_posts")
        .select("id, title")
        .in("id", postIds);

      // Map profiles and posts to comments
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const postMap = new Map(postsData?.map(p => [p.id, p]) || []);
      
      const commentsWithData = commentsData?.map(comment => ({
        ...comment,
        user_profiles: profileMap.get(comment.user_id),
        blog_posts: postMap.get(comment.blog_post_id),
      })) || [];

      setComments(commentsWithData);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const handleModerate = async (commentId: string, status: "approved" | "rejected", isSpam = false) => {
    try {
      const { error } = await supabase
        .from("blog_comments")
        .update({ 
          moderation_status: status,
          is_spam: isSpam,
          flagged_count: 0
        })
        .eq("id", commentId);

      if (error) throw error;

      toast.success(`Comment ${status}`);
      fetchComments();
    } catch (error) {
      console.error("Error moderating comment:", error);
      toast.error("Failed to moderate comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comment deleted");
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={filter === "flagged" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("flagged")}
        >
          Flagged
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
      </div>

      {comments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No comments to moderate
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {comment.user_profiles?.display_name || "Anonymous"}
                    </span>
                    <Badge variant={
                      comment.moderation_status === "approved" ? "default" :
                      comment.moderation_status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {comment.moderation_status}
                    </Badge>
                    {comment.is_spam && (
                      <Badge variant="destructive">Spam</Badge>
                    )}
                    {comment.flagged_count > 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {comment.flagged_count} flags
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    on "{comment.blog_posts?.title}" •{" "}
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-sm whitespace-pre-wrap mb-4 p-3 bg-muted/50 rounded">
                {comment.content}
              </p>

              <div className="flex gap-2">
                {comment.moderation_status !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment.id, "approved")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
                {comment.moderation_status !== "rejected" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerate(comment.id, "rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerate(comment.id, "rejected", true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mark as Spam
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
