-- Drop existing INSERT policy for videos
DROP POLICY IF EXISTS "Artists can upload videos" ON storage.objects;

-- Create new INSERT policy that explicitly allows thumbnails folder
CREATE POLICY "Artists can upload videos and thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);