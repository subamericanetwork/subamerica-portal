-- Update video bucket to allow 100MB file uploads
UPDATE storage.buckets
SET file_size_limit = 104857600
WHERE id = 'videos';