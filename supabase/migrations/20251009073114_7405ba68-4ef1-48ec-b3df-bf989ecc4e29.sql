-- Create a storage bucket for video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 
  'videos', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
);

-- Create RLS policies for video uploads
CREATE POLICY "Artists can upload their own videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can view their own videos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can delete their own videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view published videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

-- Add video_url column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_url text;