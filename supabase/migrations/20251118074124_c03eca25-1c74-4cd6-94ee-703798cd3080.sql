-- Create user_likes table to track favorited content
CREATE TABLE user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'audio', 'playlist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id, content_type)
);

-- Enable RLS
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own likes
CREATE POLICY "Users manage own likes"
  ON user_likes
  FOR ALL
  USING (auth.uid() = user_id);

-- Create user_follows table to track followed artists
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users can manage their own follows
CREATE POLICY "Users manage own follows"
  ON user_follows
  FOR ALL
  USING (auth.uid() = user_id);

-- Anyone can view follow counts
CREATE POLICY "Follow counts are public"
  ON user_follows
  FOR SELECT
  USING (true);

-- Create playback_history table
CREATE TABLE playback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'audio')),
  played_at TIMESTAMPTZ DEFAULT NOW(),
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE playback_history ENABLE ROW LEVEL SECURITY;

-- Users can view and add to their own history
CREATE POLICY "Users manage own history"
  ON playback_history
  FOR ALL
  USING (auth.uid() = user_id);

-- Create featured_content table for admin curation
CREATE TABLE featured_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  content_id UUID,
  content_type TEXT CHECK (content_type IN ('video', 'audio', 'artist')),
  featured_from TIMESTAMPTZ NOT NULL,
  featured_until TIMESTAMPTZ NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

-- Admins can manage featured content
CREATE POLICY "Admins manage featured content"
  ON featured_content
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view active featured content
CREATE POLICY "Active featured content is public"
  ON featured_content
  FOR SELECT
  USING (NOW() BETWEEN featured_from AND featured_until);

-- Create indexes for performance
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_likes_content ON user_likes(content_id, content_type);
CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX idx_user_follows_artist_id ON user_follows(artist_id);
CREATE INDEX idx_playback_history_user_id ON playback_history(user_id);
CREATE INDEX idx_playback_history_played_at ON playback_history(played_at DESC);
CREATE INDEX idx_featured_content_dates ON featured_content(featured_from, featured_until);