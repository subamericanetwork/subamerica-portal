-- Fix security definer issue by creating view with security invoker
DROP VIEW IF EXISTS public.artists_public;

CREATE VIEW public.artists_public 
WITH (security_invoker=true)
AS
SELECT 
  id,
  user_id,
  display_name,
  slug,
  scene,
  bio_short,
  bio_long,
  pronouns,
  tz,
  brand,
  socials,
  created_at,
  updated_at
  -- Explicitly exclude: email
FROM public.artists
WHERE id IN (
  SELECT artist_id 
  FROM port_settings 
  WHERE publish_status = 'published'
);

-- Add helpful comment
COMMENT ON VIEW public.artists_public IS 'Public-safe view of artists table that excludes sensitive data like email addresses. Use this view for all public-facing queries. Created with security_invoker=true to enforce caller permissions.';