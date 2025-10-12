-- Create social_connections table
CREATE TABLE public.social_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(artist_id, platform)
);

-- Enable RLS on social_connections
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_connections
CREATE POLICY "Artists can view their own connections"
  ON public.social_connections
  FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own connections"
  ON public.social_connections
  FOR INSERT
  WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own connections"
  ON public.social_connections
  FOR UPDATE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own connections"
  ON public.social_connections
  FOR DELETE
  USING (is_artist_owner(artist_id));

-- Create social_posts table
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  platform_post_id text NOT NULL,
  post_type text,
  caption text,
  media_url text,
  permalink text,
  posted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(platform, platform_post_id)
);

-- Enable RLS on social_posts
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_posts
CREATE POLICY "Artists can view their own posts"
  ON public.social_posts
  FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "System can insert posts"
  ON public.social_posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update posts"
  ON public.social_posts
  FOR UPDATE
  USING (true);

-- Create social_analytics table
CREATE TABLE public.social_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  social_post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  platform text NOT NULL,
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  engagement_rate decimal,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on social_analytics
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_analytics
CREATE POLICY "Artists can view their own analytics"
  ON public.social_analytics
  FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "System can insert analytics"
  ON public.social_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON public.social_analytics
  FOR UPDATE
  USING (true);

-- Add trigger for updated_at on social_connections
CREATE TRIGGER update_social_connections_updated_at
  BEFORE UPDATE ON public.social_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_social_connections_artist_id ON public.social_connections(artist_id);
CREATE INDEX idx_social_posts_artist_id ON public.social_posts(artist_id);
CREATE INDEX idx_social_analytics_artist_id ON public.social_analytics(artist_id);
CREATE INDEX idx_social_posts_posted_at ON public.social_posts(posted_at DESC);