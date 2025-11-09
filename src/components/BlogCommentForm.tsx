import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BlogCommentFormProps {
  postId: string;
  parentCommentId?: string;
  onCommentAdded: () => void;
  onCancel?: () => void;
}

export function BlogCommentForm({ postId, parentCommentId, onCommentAdded, onCancel }: BlogCommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (content.length > 2000) {
      toast.error("Comment is too long (max 2000 characters)");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("blog_comments").insert({
        blog_post_id: postId,
        user_id: user.id,
        parent_comment_id: parentCommentId || null,
        content: content.trim(),
        moderation_status: "pending"
      });

      if (error) throw error;

      toast.success("Comment submitted for moderation");
      setContent("");
      onCommentAdded();
      onCancel?.();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 border border-border rounded-lg bg-muted/50 text-center">
        <p className="text-muted-foreground mb-2">Sign in to leave a comment</p>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/auth"}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Share your thoughts..."}
        className="min-h-[100px]"
        maxLength={2000}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/2000 characters
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {submitting ? "Submitting..." : parentCommentId ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
