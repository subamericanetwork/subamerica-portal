-- Add UNIQUE constraint to artists.slug to prevent duplicate slugs
ALTER TABLE public.artists 
  ADD CONSTRAINT artists_slug_unique UNIQUE (slug);

-- Add CHECK constraint to validate slug format (lowercase, numbers, hyphens only)
ALTER TABLE public.artists 
  ADD CONSTRAINT artists_slug_format CHECK (slug ~ '^[a-z0-9-]+$');

-- Add CHECK constraint to validate slug length (1-50 characters)
ALTER TABLE public.artists 
  ADD CONSTRAINT artists_slug_length CHECK (length(slug) BETWEEN 1 AND 50);

-- Drop unused artists_public view to reduce attack surface
DROP VIEW IF EXISTS public.artists_public CASCADE;

-- Recreate the view excluding email for security
CREATE OR REPLACE VIEW public.artists_public AS
SELECT 
  a.id,
  a.user_id,
  a.display_name,
  a.slug,
  a.bio_short,
  a.bio_long,
  a.scene,
  a.pronouns,
  a.tz,
  a.socials,
  a.brand,
  a.created_at,
  a.updated_at
FROM public.artists a
WHERE EXISTS (
  SELECT 1 FROM public.port_settings ps
  WHERE ps.artist_id = a.id 
  AND ps.publish_status = 'published'
);