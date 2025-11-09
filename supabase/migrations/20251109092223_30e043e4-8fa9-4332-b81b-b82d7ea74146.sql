-- Muse Social™ Phase 1: Database Schema & OAuth Foundation

-- ============================================================
-- 1. CREATE NEW TABLES
-- ============================================================

-- Social authentication tokens for TikTok, Instagram, YouTube
CREATE TABLE social_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('tiktok','instagram','youtube')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  platform_user_id text,
  platform_username text,
  is_active boolean DEFAULT true,
  last_refreshed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, platform)
);

-- SubClip library for AI-generated 9:16 short-form clips
CREATE TABLE subclip_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  source_video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  clip_url text NOT NULL,
  duration integer, -- seconds
  start_time integer, -- seconds from source video
  end_time integer,
  caption text,
  qr_type text CHECK (qr_type IN ('tip','ticket','content','merch')),
  qr_url text,
  thumbnail_url text,
  status text DEFAULT 'ready' CHECK (status IN ('processing','ready','failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Social scheduled posts for multi-platform publishing
CREATE TABLE social_scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  subclip_id uuid REFERENCES subclip_library(id) ON DELETE SET NULL,
  media_type text CHECK (media_type IN ('video','audio','image')),
  platforms text[] NOT NULL,
  caption text,
  hashtags text[],
  qr_type text CHECK (qr_type IN ('tip','ticket','content','merch')),
  scheduled_at timestamptz NOT NULL,
  posted_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed','canceled')),
  external_ids jsonb DEFAULT '{}',
  error_messages jsonb,
  shared_with_network boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- QR code analytics tracking
CREATE TABLE qr_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subclip_id uuid REFERENCES subclip_library(id) ON DELETE CASCADE,
  post_id uuid REFERENCES social_scheduled_posts(id) ON DELETE CASCADE,
  qr_type text NOT NULL,
  scanned_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  converted boolean DEFAULT false,
  conversion_value numeric,
  platform text
);

-- Producer queue for network curation
CREATE TABLE producer_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES social_scheduled_posts(id) ON DELETE CASCADE NOT NULL,
  producer_id uuid REFERENCES user_profiles(user_id),
  curated boolean DEFAULT false,
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. EXTEND EXISTING TABLES
-- ============================================================

-- Add sharing and hashtag fields to social_posts
ALTER TABLE social_posts 
  ADD COLUMN IF NOT EXISTS shared_with_network boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hashtags text[];

-- ============================================================
-- 3. CREATE STORAGE BUCKET
-- ============================================================

-- Social clips bucket for SubClip outputs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social_clips', 'social_clips', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- social_auth policies
ALTER TABLE social_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view own social auth"
  ON social_auth FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert own social auth"
  ON social_auth FOR INSERT
  WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update own social auth"
  ON social_auth FOR UPDATE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete own social auth"
  ON social_auth FOR DELETE
  USING (is_artist_owner(artist_id));

-- subclip_library policies
ALTER TABLE subclip_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own subclips"
  ON subclip_library FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists create own subclips"
  ON subclip_library FOR INSERT
  WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists update own subclips"
  ON subclip_library FOR UPDATE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists delete own subclips"
  ON subclip_library FOR DELETE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Production managers view shared subclips"
  ON subclip_library FOR SELECT
  USING (
    id IN (
      SELECT subclip_id FROM social_scheduled_posts 
      WHERE shared_with_network = true
    )
    AND has_role(auth.uid(), 'production_manager'::app_role)
  );

-- social_scheduled_posts policies
ALTER TABLE social_scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists manage own posts"
  ON social_scheduled_posts FOR ALL
  USING (is_artist_owner(artist_id));

CREATE POLICY "Production managers view shared posts"
  ON social_scheduled_posts FOR SELECT
  USING (
    shared_with_network = true 
    AND has_role(auth.uid(), 'production_manager'::app_role)
  );

-- qr_analytics policies
ALTER TABLE qr_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own QR analytics"
  ON qr_analytics FOR SELECT
  USING (
    subclip_id IN (
      SELECT id FROM subclip_library 
      WHERE is_artist_owner(artist_id)
    )
    OR
    post_id IN (
      SELECT id FROM social_scheduled_posts
      WHERE is_artist_owner(artist_id)
    )
  );

CREATE POLICY "System inserts QR analytics"
  ON qr_analytics FOR INSERT
  WITH CHECK (true);

-- producer_queue policies
ALTER TABLE producer_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Production managers view queue"
  ON producer_queue FOR SELECT
  USING (has_role(auth.uid(), 'production_manager'::app_role));

CREATE POLICY "Production managers manage queue"
  ON producer_queue FOR ALL
  USING (has_role(auth.uid(), 'production_manager'::app_role));

-- ============================================================
-- 5. STORAGE BUCKET RLS POLICIES
-- ============================================================

CREATE POLICY "Artists upload own clips"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social_clips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Artists view own clips"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'social_clips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view published clips"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'social_clips');

-- ============================================================
-- 6. CREATE UPDATE TRIGGERS
-- ============================================================

CREATE TRIGGER update_social_auth_updated_at
  BEFORE UPDATE ON social_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subclip_library_updated_at
  BEFORE UPDATE ON subclip_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_scheduled_posts_updated_at
  BEFORE UPDATE ON social_scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_producer_queue_updated_at
  BEFORE UPDATE ON producer_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();