-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to handle new artist registration and send emails
CREATE OR REPLACE FUNCTION public.handle_new_artist_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  supabase_anon_key text;
BEGIN
  -- Get Supabase URL and anon key from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- If settings are not available, use vault secrets
  IF supabase_url IS NULL THEN
    SELECT decrypted_secret INTO supabase_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'SUPABASE_URL' LIMIT 1;
  END IF;

  IF supabase_anon_key IS NULL THEN
    SELECT decrypted_secret INTO supabase_anon_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1;
  END IF;

  -- Call the edge function asynchronously to send registration emails
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-registration-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || supabase_anon_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'email', NEW.email,
      'display_name', NEW.display_name,
      'slug', NEW.slug,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the registration
    RAISE WARNING 'Failed to send registration email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger that fires after artist profile is created
DROP TRIGGER IF EXISTS on_artist_profile_created ON public.artists;
CREATE TRIGGER on_artist_profile_created
  AFTER INSERT ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_artist_registration();