-- Drop the existing policy
DROP POLICY IF EXISTS "Published artists are publicly viewable" ON artists;

-- Recreate it to work for both authenticated and anonymous users
CREATE POLICY "Published artists are publicly viewable"
ON artists
FOR SELECT
USING (
  id IN (
    SELECT artist_id 
    FROM port_settings 
    WHERE publish_status = 'published'
  )
);