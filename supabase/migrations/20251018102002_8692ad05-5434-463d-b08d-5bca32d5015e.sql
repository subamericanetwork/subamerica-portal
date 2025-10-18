-- Add is_visible column to artist_social_stats table
ALTER TABLE public.artist_social_stats 
ADD COLUMN is_visible boolean DEFAULT true;

-- Update the public viewing policy to only show visible stats
DROP POLICY IF EXISTS "Published artist stats are publicly viewable" ON public.artist_social_stats;

CREATE POLICY "Published artist stats are publicly viewable"
ON public.artist_social_stats FOR SELECT
USING (
  artist_id IN (
    SELECT artist_id FROM public.port_settings
    WHERE publish_status = 'published'
  )
  AND is_visible = true
);