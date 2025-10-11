-- Add background customization columns to port_settings
ALTER TABLE port_settings 
ADD COLUMN background_type text DEFAULT 'color',
ADD COLUMN background_value text DEFAULT '#000000',
ADD COLUMN background_video_url text;

-- Add check constraint for background_type
ALTER TABLE port_settings
ADD CONSTRAINT background_type_check 
CHECK (background_type IN ('color', 'image', 'video'));

-- Create storage bucket for background media
INSERT INTO storage.buckets (id, name, public)
VALUES ('port-backgrounds', 'port-backgrounds', true);

-- RLS policy for uploading backgrounds (artists only)
CREATE POLICY "Artists can upload backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'port-backgrounds' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy for updating backgrounds (artists only)
CREATE POLICY "Artists can update backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'port-backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy for deleting backgrounds (artists only)
CREATE POLICY "Artists can delete backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'port-backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policy for viewing backgrounds (public)
CREATE POLICY "Backgrounds are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'port-backgrounds');