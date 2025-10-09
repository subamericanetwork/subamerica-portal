-- Update the videos bucket to allow image file types for event posters
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif'
]
WHERE id = 'videos';