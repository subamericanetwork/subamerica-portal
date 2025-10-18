-- Create artist_social_stats table
CREATE TABLE public.artist_social_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  platform text NOT NULL,
  followers_count integer DEFAULT 0,
  profile_url text,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone DEFAULT now(),
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(artist_id, platform)
);

-- Enable RLS
ALTER TABLE public.artist_social_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Artists can view their own stats"
ON public.artist_social_stats FOR SELECT
USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own stats"
ON public.artist_social_stats FOR INSERT
WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own stats"
ON public.artist_social_stats FOR UPDATE
USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own stats"
ON public.artist_social_stats FOR DELETE
USING (is_artist_owner(artist_id));

CREATE POLICY "Admins can view all stats"
ON public.artist_social_stats FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert any stats"
ON public.artist_social_stats FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any stats"
ON public.artist_social_stats FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Published artist stats are publicly viewable"
ON public.artist_social_stats FOR SELECT
USING (
  artist_id IN (
    SELECT artist_id FROM public.port_settings
    WHERE publish_status = 'published'
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_artist_social_stats_updated_at
  BEFORE UPDATE ON public.artist_social_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();