-- Fix the security warning: set search_path for the function
CREATE OR REPLACE FUNCTION calculate_artist_share()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.artist_share := NEW.amount * 0.80;
  RETURN NEW;
END;
$$;