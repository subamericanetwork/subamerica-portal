-- Make the videos storage bucket public so videos can be viewed on published ports
UPDATE storage.buckets 
SET public = true 
WHERE id = 'videos';