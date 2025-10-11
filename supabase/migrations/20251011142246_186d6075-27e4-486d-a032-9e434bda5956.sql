-- Add constraints if they don't exist (handle idempotency)
DO $$ 
BEGIN
  -- Add UNIQUE constraint to artists.slug
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_slug_unique'
  ) THEN
    ALTER TABLE public.artists ADD CONSTRAINT artists_slug_unique UNIQUE (slug);
  END IF;

  -- Add CHECK constraint for slug format
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_slug_format'
  ) THEN
    ALTER TABLE public.artists ADD CONSTRAINT artists_slug_format CHECK (slug ~ '^[a-z0-9-]+$');
  END IF;

  -- Add CHECK constraint for slug length
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_slug_length'
  ) THEN
    ALTER TABLE public.artists ADD CONSTRAINT artists_slug_length CHECK (length(slug) BETWEEN 1 AND 50);
  END IF;
END $$;

-- Recreate the artists_public view excluding email for security
DROP VIEW IF EXISTS public.artists_public CASCADE;

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