-- Add livepush_stream_id column to store the artist's Livepush stream ID
ALTER TABLE livepush_artist_permissions
ADD COLUMN livepush_stream_id TEXT;