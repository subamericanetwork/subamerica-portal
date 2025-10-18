-- Drop the generated column and recreate as a regular column with trigger
ALTER TABLE tips DROP COLUMN IF EXISTS artist_share CASCADE;

-- Add artist_share as a regular numeric column
ALTER TABLE tips ADD COLUMN artist_share numeric;

-- Create trigger function to calculate 80% share (amount is in cents)
CREATE OR REPLACE FUNCTION calculate_artist_share()
RETURNS TRIGGER AS $$
BEGIN
  NEW.artist_share := NEW.amount * 0.80;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER calculate_artist_share
  BEFORE INSERT OR UPDATE OF amount ON tips
  FOR EACH ROW
  EXECUTE FUNCTION calculate_artist_share();

-- Update existing records
UPDATE tips SET artist_share = amount * 0.80;