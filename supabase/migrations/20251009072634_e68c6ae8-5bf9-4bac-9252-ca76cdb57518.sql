-- Add user_id to port_settings to break circular RLS dependency
ALTER TABLE port_settings ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create a trigger to auto-populate user_id from artists table
CREATE OR REPLACE FUNCTION set_port_settings_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := (SELECT user_id FROM artists WHERE id = NEW.artist_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_port_settings_user_id_trigger
BEFORE INSERT OR UPDATE ON port_settings
FOR EACH ROW
EXECUTE FUNCTION set_port_settings_user_id();

-- Backfill existing records
UPDATE port_settings
SET user_id = (SELECT user_id FROM artists WHERE artists.id = port_settings.artist_id)
WHERE user_id IS NULL;

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Artists can view their own port settings" ON port_settings;

-- Create new policy using user_id directly (no recursion)
CREATE POLICY "Artists can view their own port settings"
ON port_settings
FOR SELECT
USING (auth.uid() = user_id);