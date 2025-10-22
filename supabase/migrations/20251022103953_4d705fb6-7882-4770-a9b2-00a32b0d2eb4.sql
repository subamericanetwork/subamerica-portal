-- Drop the existing function
DROP FUNCTION IF EXISTS public.approve_artist_application(uuid, uuid, text);

-- Recreate with better duplicate handling
CREATE OR REPLACE FUNCTION public.approve_artist_application(
  application_id uuid, 
  admin_id uuid, 
  admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  app_record artist_applications%ROWTYPE;
  new_artist_id uuid;
  supabase_url text;
  supabase_anon_key text;
  request_id bigint;
  user_email text;
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

  -- Get user email
  SELECT email INTO user_email
  FROM user_profiles
  WHERE user_id = app_record.user_id;

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
  ) VALUES (
    app_record.user_id,
    user_email,
    app_record.artist_name,
    final_slug,
    LEFT(app_record.bio, 200),
    app_record.bio,
    app_record.scene,
    '{}'::jsonb,
    '{}'::jsonb,
    'free'::subscription_tier,
    false
  )
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

  -- Send approval email
  SELECT decrypted_secret INTO supabase_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL' 
  LIMIT 1;

  SELECT decrypted_secret INTO supabase_anon_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_ANON_KEY' 
  LIMIT 1;

  IF supabase_url IS NOT NULL AND supabase_anon_key IS NOT NULL AND user_email IS NOT NULL THEN
    BEGIN
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/send-approval-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || supabase_anon_key
        ),
        body := jsonb_build_object(
          'artist_email', user_email,
          'artist_name', app_record.artist_name,
          'slug', final_slug,
          'admin_notes', approve_artist_application.admin_notes
        )
      ) INTO request_id;
      
      RAISE LOG 'Approval email queued with request_id: %', request_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the approval
        RAISE WARNING 'Failed to send approval email: %', SQLERRM;
    END;
  END IF;

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
$function$;