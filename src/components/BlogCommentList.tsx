import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BlogCommentForm } from "./BlogCommentForm";
import { MessageSquare, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  moderation_status: string;
  is_spam: boolean;
  flagged_count: number;
  user_profiles?: {
    display_name: string;
  };
  replies?: Comment[];
}

interface BlogCommentListProps {
  postId: string;
}

export function BlogCommentList({ postId }: BlogCommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("blog_post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch user profiles separately
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      // Map profiles to comments
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        user_profiles: profileMap.get(comment.user_id),
      })) || [];

      // Organize comments into nested structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      commentsWithProfiles.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      commentMap.forEach((comment) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies!.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`blog_comments_${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blog_comments",
          filter: `blog_post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

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
    } finally {
      setDeletingId(null);
    }
  };

  const handleFlag = async (commentId: string) => {
    try {
      const comment = findComment(comments, commentId);
      if (!comment) return;

      const { error } = await supabase
        .from("blog_comments")
        .update({ flagged_count: (comment.flagged_count || 0) + 1 })
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comment flagged for review");
      fetchComments();
    } catch (error) {
      console.error("Error flagging comment:", error);
      toast.error("Failed to flag comment");
    }
  };

  const findComment = (comments: Comment[], id: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const found = findComment(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const canDelete = user?.id === comment.user_id;
    const isPending = comment.moderation_status === "pending" && user?.id === comment.user_id;

    return (
      <div key={comment.id} className={depth > 0 ? "ml-8 mt-4" : "mt-6"}>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-semibold text-sm">
                {comment.user_profiles?.display_name || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(comment.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isPending && (
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                  Pending
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {user && !canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFlag(comment.id)}
                  className="h-8"
                >
                  <Flag className="h-3 w-3" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(comment.id)}
                  className="h-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="mt-2 h-8"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {replyingTo === comment.id && (
            <div className="mt-4">
              <BlogCommentForm
                postId={postId}
                parentCommentId={comment.id}
                onCommentAdded={() => {
                  setReplyingTo(null);
                  fetchComments();
                }}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}
        </div>
        {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      
      <BlogCommentForm postId={postId} onCommentAdded={fetchComments} />

      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
