-- Security Fix 1: Drop the artists_public view as it lacks RLS and duplicates artists table functionality
-- The artists table already has proper RLS policies for published content
DROP VIEW IF EXISTS public.artists_public;

-- Security Fix 2: Add explicit length validation constraints for text fields
-- This prevents excessively long input that could cause issues

-- Add length constraints to artists table
ALTER TABLE public.artists
  ADD CONSTRAINT bio_short_length CHECK (char_length(bio_short) <= 500),
  ADD CONSTRAINT bio_long_length CHECK (char_length(bio_long) <= 5000),
  ADD CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100),
  ADD CONSTRAINT scene_length CHECK (char_length(scene) <= 100),
  ADD CONSTRAINT pronouns_length CHECK (char_length(pronouns) <= 50);

-- Add length constraints to events table
ALTER TABLE public.events
  ADD CONSTRAINT title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT description_length CHECK (char_length(description) <= 2000),
  ADD CONSTRAINT venue_length CHECK (char_length(venue) <= 200);

-- Add length constraints to products table
ALTER TABLE public.products
  ADD CONSTRAINT product_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT product_description_length CHECK (char_length(description) <= 2000),
  ADD CONSTRAINT product_pitch_length CHECK (char_length(pitch) <= 500);

-- Add length constraints to artist_faqs table
ALTER TABLE public.artist_faqs
  ADD CONSTRAINT question_length CHECK (char_length(question) <= 500),
  ADD CONSTRAINT answer_length CHECK (char_length(answer) <= 2000);

-- Add length constraints to videos table
ALTER TABLE public.videos
  ADD CONSTRAINT video_title_length CHECK (char_length(title) <= 200);

-- Security Fix 3: Add URL validation constraints
ALTER TABLE public.port_settings
  ADD CONSTRAINT custom_domain_format CHECK (
    custom_domain IS NULL OR 
    (custom_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$')
  );

-- Add comment explaining security improvements
COMMENT ON TABLE public.artists IS 'Artist profiles with length-validated fields to prevent injection attacks and ensure data integrity';