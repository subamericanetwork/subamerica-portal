-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post-media', 'post-media', true);

-- RLS policies for post-media bucket
CREATE POLICY "Artists can upload their own post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM artists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Artists can update their own post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM artists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Artists can delete their own post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM artists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');