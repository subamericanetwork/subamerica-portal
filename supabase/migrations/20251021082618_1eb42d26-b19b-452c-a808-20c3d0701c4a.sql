-- Create member_playlists table for user-created playlists
CREATE TABLE IF NOT EXISTS public.member_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  video_ids UUID[] DEFAULT ARRAY[]::UUID[],
  content_type TEXT CHECK (content_type IN ('video', 'audio', 'mixed')) DEFAULT 'mixed',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_playlists_user_id ON public.member_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_member_playlists_is_public ON public.member_playlists(is_public);

-- Enable RLS
ALTER TABLE public.member_playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_playlists
-- Members can view their own playlists
CREATE POLICY "Users can view their own playlists"
ON public.member_playlists
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view public playlists
CREATE POLICY "Public playlists are viewable by everyone"
ON public.member_playlists
FOR SELECT
USING (is_public = true);

-- Members can create their own playlists
CREATE POLICY "Users can create their own playlists"
ON public.member_playlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Members can update their own playlists
CREATE POLICY "Users can update their own playlists"
ON public.member_playlists
FOR UPDATE
USING (auth.uid() = user_id);

-- Members can delete their own playlists
CREATE POLICY "Users can delete their own playlists"
ON public.member_playlists
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_member_playlists_updated_at
BEFORE UPDATE ON public.member_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();