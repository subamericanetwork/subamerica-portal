-- Helper function to approve artist applications and create artist accounts
CREATE OR REPLACE FUNCTION approve_artist_application(
  application_id uuid,
  admin_id uuid,
  admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_record artist_applications%ROWTYPE;
  new_artist_id uuid;
  result json;
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
      'error', 'User already has artist role'
    );
  END IF;

  -- Create artist record
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
    (SELECT email FROM user_profiles WHERE user_id = app_record.user_id),
    app_record.artist_name,
    app_record.slug,
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
    admin_notes = admin_notes
  WHERE id = application_id;

  RETURN json_build_object(
    'success', true,
    'artist_id', new_artist_id,
    'message', 'Artist account created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_applications_status 
  ON artist_applications(status);

CREATE INDEX IF NOT EXISTS idx_artist_applications_appeal 
  ON artist_applications(appeal_status) 
  WHERE appeal_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artist_applications_submitted_at 
  ON artist_applications(submitted_at DESC);