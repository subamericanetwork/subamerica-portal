-- Allow anonymous users to view published port settings
CREATE POLICY "Published port settings are publicly viewable"
ON port_settings
FOR SELECT
TO public
USING (publish_status = 'published');