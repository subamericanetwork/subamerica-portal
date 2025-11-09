-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  is_spam BOOLEAN DEFAULT false,
  flagged_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) > 0 AND char_length(content) <= 2000)
);

-- Enable RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Index for faster queries
CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(blog_post_id);
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments(parent_comment_id);
CREATE INDEX idx_blog_comments_user_id ON public.blog_comments(user_id);

-- RLS Policies
-- Users can view approved comments on published posts
CREATE POLICY "Approved comments are publicly viewable"
ON public.blog_comments
FOR SELECT
USING (
  moderation_status = 'approved' 
  AND blog_post_id IN (
    SELECT id FROM blog_posts 
    WHERE publish_status = 'published' AND published_at IS NOT NULL
  )
);

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can create comments"
ON public.blog_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND blog_post_id IN (
    SELECT id FROM blog_posts 
    WHERE publish_status = 'published' AND published_at IS NOT NULL
  )
);

-- Users can view their own comments regardless of moderation status
CREATE POLICY "Users can view their own comments"
ON public.blog_comments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own pending comments
CREATE POLICY "Users can update their own pending comments"
ON public.blog_comments
FOR UPDATE
USING (auth.uid() = user_id AND moderation_status = 'pending');

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.blog_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
ON public.blog_comments
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update any comment (for moderation)
CREATE POLICY "Admins can update comments"
ON public.blog_comments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete any comment
CREATE POLICY "Admins can delete comments"
ON public.blog_comments
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_blog_comments_updated_at
BEFORE UPDATE ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();