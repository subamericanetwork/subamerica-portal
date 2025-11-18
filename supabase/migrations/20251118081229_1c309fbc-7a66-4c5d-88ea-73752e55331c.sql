-- Add foreign key constraints to ensure data integrity and enable proper joins

-- Add foreign key from videos to artists
ALTER TABLE videos 
ADD CONSTRAINT fk_videos_artist 
FOREIGN KEY (artist_id) 
REFERENCES artists(id) 
ON DELETE SET NULL;

-- Add foreign key from audio_tracks to artists  
ALTER TABLE audio_tracks
ADD CONSTRAINT fk_audio_tracks_artist
FOREIGN KEY (artist_id)
REFERENCES artists(id)
ON DELETE SET NULL;

-- Add foreign key from playback_history to artists
ALTER TABLE playback_history
ADD CONSTRAINT fk_playback_history_artist
FOREIGN KEY (artist_id)
REFERENCES artists(id)
ON DELETE SET NULL;