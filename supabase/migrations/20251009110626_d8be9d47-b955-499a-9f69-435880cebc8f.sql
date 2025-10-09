-- Create policy to allow public access to published artists
CREATE POLICY "Published artists are publicly viewable"
ON artists
FOR SELECT
TO public
USING (
  id IN (
    SELECT artist_id 
    FROM port_settings 
    WHERE publish_status = 'published'
  )
);