-- Fix the registration email trigger to properly retrieve Supabase credentials
CREATE OR REPLACE FUNCTION public.handle_new_artist_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  supabase_anon_key text;
  request_id bigint;
BEGIN
  -- Get Supabase URL and anon key from vault secrets
  SELECT decrypted_secret INTO supabase_url 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_URL' 
  LIMIT 1;

  SELECT decrypted_secret INTO supabase_anon_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_ANON_KEY' 
  LIMIT 1;

  -- Only proceed if we have both URL and key
  IF supabase_url IS NOT NULL AND supabase_anon_key IS NOT NULL THEN
    -- Call the edge function asynchronously to send registration emails
    SELECT net.http_post(
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
    ) INTO request_id;
    
    RAISE LOG 'Registration email queued with request_id: %', request_id;
  ELSE
    RAISE WARNING 'Could not send registration email: missing Supabase credentials (url: %, key: %)', 
      supabase_url IS NOT NULL, supabase_anon_key IS NOT NULL;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the registration
    RAISE WARNING 'Failed to send registration email: %', SQLERRM;
    RETURN NEW;
END;
$$;