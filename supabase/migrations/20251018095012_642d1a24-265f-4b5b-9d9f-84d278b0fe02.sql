-- Drop the existing foreign key constraint
ALTER TABLE livepush_videos 
DROP CONSTRAINT IF EXISTS livepush_videos_video_id_fkey;

-- Recreate the foreign key with CASCADE deletion
ALTER TABLE livepush_videos
ADD CONSTRAINT livepush_videos_video_id_fkey 
FOREIGN KEY (video_id) 
REFERENCES videos(id) 
ON DELETE CASCADE;