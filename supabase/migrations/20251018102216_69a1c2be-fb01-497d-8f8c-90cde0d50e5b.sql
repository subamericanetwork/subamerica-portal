-- Add show_stats column to artist_social_stats table
ALTER TABLE public.artist_social_stats 
ADD COLUMN show_stats boolean DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.artist_social_stats.is_visible IS 'Controls whether the platform link/icon is shown on port';
COMMENT ON COLUMN public.artist_social_stats.show_stats IS 'Controls whether follower counts and metrics are shown on port';