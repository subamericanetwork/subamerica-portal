-- Phase 1: Livestreaming Foundation Database Setup

-- Step 1: Handle subscription tier naming (safe approach)
-- First check if old values exist, only rename if they do
DO $$
BEGIN
  -- Only rename if the old values still exist
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free' AND enumtypid = 'subscription_tier'::regtype) THEN
    ALTER TYPE subscription_tier RENAME VALUE 'free' TO 'signal';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'basic' AND enumtypid = 'subscription_tier'::regtype) THEN
    ALTER TYPE subscription_tier RENAME VALUE 'basic' TO 'sonar';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'premium' AND enumtypid = 'subscription_tier'::regtype) THEN
    ALTER TYPE subscription_tier RENAME VALUE 'premium' TO 'trident';
  END IF;
END$$;

-- Step 2: Create artist_live_streams table
CREATE TABLE IF NOT EXISTS public.artist_live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  
  -- Stream metadata
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  scheduled_start TIMESTAMPTZ,
  
  -- Livepush connection
  stream_key TEXT NOT NULL,
  rtmp_ingest_url TEXT NOT NULL,
  livepush_stream_id TEXT,
  
  -- HLS outputs
  hls_playback_url TEXT,
  hls_tv_feed_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  
  -- Recording & conversion
  cloudinary_vod_url TEXT,
  cloudinary_public_id TEXT,
  converted_to_track BOOLEAN DEFAULT false,
  converted_track_id UUID,
  
  -- Analytics
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_watch_time_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE artist_live_streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists manage own streams" ON artist_live_streams;
CREATE POLICY "Artists manage own streams"
  ON artist_live_streams FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view public streams" ON artist_live_streams;
CREATE POLICY "Anyone can view public streams"
  ON artist_live_streams FOR SELECT
  USING (status IN ('scheduled', 'live', 'ended'));

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON artist_live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_artist ON artist_live_streams(artist_id);

-- Step 3: Add streaming fields to artists table (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'streaming_minutes_used') THEN
    ALTER TABLE artists ADD COLUMN streaming_minutes_used INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'streaming_minutes_included') THEN
    ALTER TABLE artists ADD COLUMN streaming_minutes_included INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'last_streaming_reset') THEN
    ALTER TABLE artists ADD COLUMN last_streaming_reset TIMESTAMPTZ DEFAULT now();
  END IF;
END$$;

-- Update existing artists based on tier
UPDATE artists 
SET streaming_minutes_included = CASE
  WHEN subscription_tier::text = 'trident' THEN 600
  ELSE 0
END
WHERE streaming_minutes_included = 0;

-- Step 4: Create streaming_time_purchases table
CREATE TABLE IF NOT EXISTS public.streaming_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  minutes_purchased INTEGER NOT NULL,
  amount_paid NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE streaming_time_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists view own purchases" ON streaming_time_purchases;
CREATE POLICY "Artists view own purchases"
  ON streaming_time_purchases FOR SELECT
  USING (artist_id IN (
    SELECT id FROM artists WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "System inserts purchases" ON streaming_time_purchases;
CREATE POLICY "System inserts purchases"
  ON streaming_time_purchases FOR INSERT
  WITH CHECK (true);

-- Step 5: Update videos & audio_tracks for source tracking (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'source_type') THEN
    ALTER TABLE videos ADD COLUMN source_type TEXT DEFAULT 'upload';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'source_stream_id') THEN
    ALTER TABLE videos ADD COLUMN source_stream_id UUID REFERENCES artist_live_streams(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'recorded_on_mobile') THEN
    ALTER TABLE videos ADD COLUMN recorded_on_mobile BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'recording_duration_seconds') THEN
    ALTER TABLE videos ADD COLUMN recording_duration_seconds INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'cloudinary_public_id') THEN
    ALTER TABLE videos ADD COLUMN cloudinary_public_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'cloudinary_resource_type') THEN
    ALTER TABLE videos ADD COLUMN cloudinary_resource_type TEXT DEFAULT 'video';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_tracks' AND column_name = 'source_type') THEN
    ALTER TABLE audio_tracks ADD COLUMN source_type TEXT DEFAULT 'upload';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_tracks' AND column_name = 'source_stream_id') THEN
    ALTER TABLE audio_tracks ADD COLUMN source_stream_id UUID REFERENCES artist_live_streams(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_tracks' AND column_name = 'recorded_on_mobile') THEN
    ALTER TABLE audio_tracks ADD COLUMN recorded_on_mobile BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_tracks' AND column_name = 'recording_duration_seconds') THEN
    ALTER TABLE audio_tracks ADD COLUMN recording_duration_seconds INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_tracks' AND column_name = 'cloudinary_public_id') THEN
    ALTER TABLE audio_tracks ADD COLUMN cloudinary_public_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audio_tracks' AND column_name = 'cloudinary_resource_type') THEN
    ALTER TABLE audio_tracks ADD COLUMN cloudinary_resource_type TEXT DEFAULT 'video';
  END IF;
END$$;

-- Step 6: Create helper functions
CREATE OR REPLACE FUNCTION deduct_streaming_minutes(
  p_artist_id UUID,
  p_minutes_used INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE artists
  SET streaming_minutes_used = streaming_minutes_used + p_minutes_used
  WHERE id = p_artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION reset_monthly_streaming_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE artists
  SET 
    streaming_minutes_used = 0,
    last_streaming_reset = now()
  WHERE subscription_tier::text = 'trident';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION can_start_stream(p_artist_id UUID)
RETURNS JSONB AS $$
DECLARE
  artist_record RECORD;
  minutes_remaining INTEGER;
BEGIN
  SELECT * INTO artist_record
  FROM artists
  WHERE id = p_artist_id;
  
  IF artist_record.subscription_tier::text != 'trident' THEN
    RETURN jsonb_build_object(
      'can_stream', false,
      'reason', 'upgrade_required',
      'message', 'Upgrade to Trident to go live!'
    );
  END IF;
  
  minutes_remaining := 
    artist_record.streaming_minutes_included - 
    artist_record.streaming_minutes_used;
  
  IF minutes_remaining <= 0 THEN
    RETURN jsonb_build_object(
      'can_stream', false,
      'reason', 'no_minutes',
      'message', 'Purchase more streaming time to continue'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_stream', true,
    'minutes_remaining', minutes_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 7: Create trigger for updated_at on artist_live_streams
DROP TRIGGER IF EXISTS update_artist_live_streams_updated_at ON artist_live_streams;
CREATE TRIGGER update_artist_live_streams_updated_at
BEFORE UPDATE ON artist_live_streams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();