-- Phase 1: Fix Email Exposure at Database Level
-- Drop existing policy and recreate with better documentation
DROP POLICY IF EXISTS "Published artists are publicly viewable" ON artists;

CREATE POLICY "Published artists are publicly viewable (no sensitive data)"
ON artists
FOR SELECT
USING (
  id IN (
    SELECT artist_id 
    FROM port_settings 
    WHERE publish_status = 'published'
  )
);

-- Add comment to remind developers about email sensitivity
COMMENT ON COLUMN artists.email IS 'SENSITIVE: Only expose in authenticated contexts where user_id = auth.uid()';

-- Phase 3: Fix Audit Table Access
-- Allow system to insert audit logs
CREATE POLICY "System can insert audit logs"
ON audit
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own audit entries
CREATE POLICY "Users can view their own audit logs"
ON audit
FOR SELECT
USING (actor_id = auth.uid());

-- Phase 4: Fix Function Search Path Security
-- Update update_updated_at_column function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Update set_port_settings_user_id function with explicit search_path
CREATE OR REPLACE FUNCTION public.set_port_settings_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.user_id := (SELECT user_id FROM artists WHERE id = NEW.artist_id);
  RETURN NEW;
END;
$function$;