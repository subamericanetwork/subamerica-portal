-- Fix approve_artist_application function to use 'signal' instead of 'free'
CREATE OR REPLACE FUNCTION public.approve_artist_application(
  application_id uuid, 
  admin_id uuid, 
  admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  app_record artist_applications%ROWTYPE;
  new_artist_id uuid;
  slug_suffix integer := 0;
  final_slug text;
BEGIN
  -- Get application details
  SELECT * INTO app_record
  FROM artist_applications
  WHERE id = application_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Application not found or already processed'
    );
  END IF;

  -- Check if user already has artist role
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = app_record.user_id 
    AND role = 'artist'::app_role
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already has an artist account'
    );
  END IF;

  -- Check if slug is already taken by another user
  IF EXISTS (
    SELECT 1 FROM artists 
    WHERE slug = app_record.slug 
    AND user_id != app_record.user_id
  ) THEN
    -- Generate a unique slug by appending a number
    final_slug := app_record.slug;
    WHILE EXISTS (SELECT 1 FROM artists WHERE slug = final_slug) LOOP
      slug_suffix := slug_suffix + 1;
      final_slug := app_record.slug || '-' || slug_suffix;
    END LOOP;
  ELSE
    final_slug := app_record.slug;
  END IF;

  -- Create artist record with potentially modified slug
  INSERT INTO artists (
    user_id,
    email,
    display_name,
    slug,
    bio_short,
    bio_long,
    scene,
    brand,
    socials,
    subscription_tier,
    is_verified
  ) 
  SELECT
    app_record.user_id,
    up.email,
    app_record.artist_name,
    final_slug,
    LEFT(app_record.bio, 200),
    app_record.bio,
    app_record.scene,
    '{}'::jsonb,
    '{}'::jsonb,
    'signal'::subscription_tier,
    false
  FROM user_profiles up
  WHERE up.user_id = app_record.user_id
  RETURNING id INTO new_artist_id;

  -- Assign artist role
  INSERT INTO user_roles (user_id, role)
  VALUES (app_record.user_id, 'artist'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create default port settings
  INSERT INTO port_settings (
    artist_id,
    user_id,
    publish_status,
    background_type,
    background_value
  ) VALUES (
    new_artist_id,
    app_record.user_id,
    'draft'::publish_status,
    'color',
    '#000000'
  );

  -- Update application status
  UPDATE artist_applications
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = admin_id,
    admin_notes = approve_artist_application.admin_notes
  WHERE id = application_id;

  RETURN json_build_object(
    'success', true,
    'artist_id', new_artist_id,
    'slug', final_slug,
    'message', CASE 
      WHEN final_slug != app_record.slug 
      THEN 'Artist account created with modified slug: ' || final_slug || ' (original was taken)'
      ELSE 'Artist account created successfully'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;