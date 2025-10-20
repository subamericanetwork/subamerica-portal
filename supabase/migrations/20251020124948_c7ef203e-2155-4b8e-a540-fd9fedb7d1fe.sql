-- Create enum for media types
CREATE TYPE media_type AS ENUM ('image', 'video');

-- Create enum for publish status
CREATE TYPE post_publish_status AS ENUM ('draft', 'published', 'archived');

-- Create artist_posts table
CREATE TABLE public.artist_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  media_url TEXT NOT NULL,
  media_type media_type NOT NULL DEFAULT 'image',
  publish_status post_publish_status NOT NULL DEFAULT 'draft',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_artist_posts_artist_id ON public.artist_posts(artist_id);
CREATE INDEX idx_artist_posts_publish_status ON public.artist_posts(publish_status);
CREATE INDEX idx_artist_posts_display_order ON public.artist_posts(display_order);

-- Add updated_at trigger
CREATE TRIGGER update_artist_posts_updated_at
  BEFORE UPDATE ON public.artist_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.artist_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Artists can view their own posts"
  ON public.artist_posts FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own posts"
  ON public.artist_posts FOR INSERT
  WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own posts"
  ON public.artist_posts FOR UPDATE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own posts"
  ON public.artist_posts FOR DELETE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Published artist posts are publicly viewable"
  ON public.artist_posts FOR SELECT
  USING (
    publish_status = 'published' 
    AND artist_id IN (
      SELECT artist_id 
      FROM public.port_settings 
      WHERE publish_status = 'published'
    )
  );