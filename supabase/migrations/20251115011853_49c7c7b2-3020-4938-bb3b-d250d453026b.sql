-- Enable realtime for artist_live_streams table
ALTER PUBLICATION supabase_realtime ADD TABLE artist_live_streams;

-- Add index for faster live stream queries
CREATE INDEX IF NOT EXISTS idx_artist_live_streams_status ON artist_live_streams(status);
CREATE INDEX IF NOT EXISTS idx_artist_live_streams_viewer_count ON artist_live_streams(viewer_count DESC) WHERE status = 'live';