-- Update video bucket to allow 50MB files
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'videos';