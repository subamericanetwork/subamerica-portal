-- Add views column to social_analytics table
ALTER TABLE social_analytics 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add performance indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_social_posts_artist_posted 
ON social_posts(artist_id, posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_qr_analytics_subclip_converted 
ON qr_analytics(subclip_id, converted);

CREATE INDEX IF NOT EXISTS idx_social_analytics_post_platform 
ON social_analytics(social_post_id, platform);

CREATE INDEX IF NOT EXISTS idx_social_scheduled_posts_scheduled 
ON social_scheduled_posts(artist_id, scheduled_at, status);