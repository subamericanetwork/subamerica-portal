-- Fix security warnings: Add search_path to functions that don't have it

-- Fix within_retraction_window function
CREATE OR REPLACE FUNCTION public.within_retraction_window(published_timestamp timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN published_timestamp IS NOT NULL 
    AND published_timestamp > NOW() - INTERVAL '1 hour';
END;
$$;

-- Fix should_auto_approve_content function
CREATE OR REPLACE FUNCTION public.should_auto_approve_content(artist_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_verified BOOLEAN;
BEGIN
  SELECT is_verified INTO artist_verified
  FROM artists
  WHERE id = artist_id_param;
  
  RETURN COALESCE(artist_verified, false);
END;
$$;

-- Fix is_artist function
CREATE OR REPLACE FUNCTION public.is_artist(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN has_role(user_id_param, 'artist'::app_role);
END;
$$;

-- Fix create_user_profile function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;