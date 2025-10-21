-- Create trigger function to send application emails
CREATE OR REPLACE FUNCTION public.handle_new_artist_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  supabase_anon_key text;
  request_id bigint;
  user_email text;
  user_display_name text;
BEGIN
  -- Get user information from user_profiles
  SELECT email, display_name 
  INTO user_email, user_display_name
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- Get Supabase URL and anon key from vault secrets
  SELECT decrypted_secret INTO supabase_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL' 
  LIMIT 1;

  SELECT decrypted_secret INTO supabase_anon_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_ANON_KEY' 
  LIMIT 1;

  -- Only proceed if we have all required data
  IF supabase_url IS NOT NULL AND supabase_anon_key IS NOT NULL AND user_email IS NOT NULL THEN
    -- Call the edge function asynchronously to send application emails
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/send-application-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_anon_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'email', user_email,
        'display_name', COALESCE(user_display_name, 'Artist'),
        'artist_name', NEW.artist_name,
        'slug', NEW.slug,
        'bio', NEW.bio,
        'why_join', NEW.why_join,
        'scene', NEW.scene,
        'portfolio_links', NEW.portfolio_links,
        'created_at', NEW.created_at
      )
    ) INTO request_id;
    
    RAISE LOG 'Application email queued with request_id: %', request_id;
  ELSE
    RAISE WARNING 'Could not send application email: missing required data (url: %, key: %, email: %)', 
      supabase_url IS NOT NULL, supabase_anon_key IS NOT NULL, user_email IS NOT NULL;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the application submission
    RAISE WARNING 'Failed to send application email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on artist_applications table
DROP TRIGGER IF EXISTS on_artist_application_created ON public.artist_applications;

CREATE TRIGGER on_artist_application_created
  AFTER INSERT ON public.artist_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_artist_application();