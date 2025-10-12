-- =====================================================
-- PHASE 1: LIVEPUSH INTEGRATION - MISSING TABLES ONLY
-- =====================================================

-- 1. LIVEPUSH ARTIST PERMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.livepush_artist_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Feature toggles
  livepush_enabled BOOLEAN DEFAULT false,
  multistreaming_enabled BOOLEAN DEFAULT false,
  playlist_streams_enabled BOOLEAN DEFAULT true,
  copyright_check_enabled BOOLEAN DEFAULT false,
  
  -- Limits based on tier
  max_concurrent_streams INTEGER DEFAULT 0,
  max_monthly_stream_hours INTEGER DEFAULT 0,
  max_playlist_videos INTEGER DEFAULT 10,
  max_multistream_destinations INTEGER DEFAULT 0,
  
  -- Usage tracking
  current_month_stream_hours NUMERIC(6,2) DEFAULT 0,
  last_stream_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Admin controls
  requires_approval BOOLEAN DEFAULT true,
  is_trusted_artist BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.livepush_artist_permissions ENABLE ROW LEVEL SECURITY;

-- Auto-create permissions on artist signup
CREATE OR REPLACE FUNCTION create_livepush_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO livepush_artist_permissions (artist_id)
  VALUES (NEW.id)
  ON CONFLICT (artist_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_artist_created_permissions ON artists;
CREATE TRIGGER on_artist_created_permissions
  AFTER INSERT ON artists
  FOR EACH ROW
  EXECUTE FUNCTION create_livepush_permissions();

-- RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own permissions' AND tablename = 'livepush_artist_permissions') THEN
    CREATE POLICY "Artists view own permissions"
    ON public.livepush_artist_permissions FOR SELECT
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all permissions' AND tablename = 'livepush_artist_permissions') THEN
    CREATE POLICY "Admins view all permissions"
    ON public.livepush_artist_permissions FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins update permissions' AND tablename = 'livepush_artist_permissions') THEN
    CREATE POLICY "Admins update permissions"
    ON public.livepush_artist_permissions FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 2. LIVEPUSH VIDEO SYNC
-- =====================================================
CREATE TABLE IF NOT EXISTS public.livepush_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) NOT NULL,
  video_id UUID REFERENCES videos(id) NOT NULL UNIQUE,
  
  livepush_id TEXT,
  livepush_url TEXT,
  
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  sync_started_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  
  approval_status TEXT DEFAULT 'approved',
  approved_by UUID REFERENCES auth.users(id),
  approval_notes TEXT,
  
  copyright_detected BOOLEAN DEFAULT false,
  copyright_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.livepush_videos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own livepush videos' AND tablename = 'livepush_videos') THEN
    CREATE POLICY "Artists view own livepush videos"
    ON public.livepush_videos FOR SELECT
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists insert own livepush videos' AND tablename = 'livepush_videos') THEN
    CREATE POLICY "Artists insert own livepush videos"
    ON public.livepush_videos FOR INSERT
    WITH CHECK (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists update own livepush videos' AND tablename = 'livepush_videos') THEN
    CREATE POLICY "Artists update own livepush videos"
    ON public.livepush_videos FOR UPDATE
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all livepush videos' AND tablename = 'livepush_videos') THEN
    CREATE POLICY "Admins view all livepush videos"
    ON public.livepush_videos FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins update all livepush videos' AND tablename = 'livepush_videos') THEN
    CREATE POLICY "Admins update all livepush videos"
    ON public.livepush_videos FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 3. STREAM PLAYLISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stream_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  video_ids UUID[] NOT NULL,
  video_order JSONB,
  
  loop_mode TEXT DEFAULT 'infinite',
  loop_count INTEGER,
  shuffle BOOLEAN DEFAULT false,
  
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  auto_start BOOLEAN DEFAULT false,
  
  livepush_stream_id TEXT,
  rtmp_url TEXT,
  stream_key TEXT,
  
  multistream_destinations JSONB DEFAULT '[]'::jsonb,
  
  status TEXT DEFAULT 'draft',
  viewer_count INTEGER DEFAULT 0,
  
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  qr_code_enabled BOOLEAN DEFAULT true,
  qr_code_position TEXT DEFAULT 'bottom-right',
  qr_code_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.stream_playlists ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Artists view own playlists"
    ON public.stream_playlists FOR SELECT
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists create own playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Artists create own playlists"
    ON public.stream_playlists FOR INSERT
    WITH CHECK (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists update own playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Artists update own playlists"
    ON public.stream_playlists FOR UPDATE
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists delete own playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Artists delete own playlists"
    ON public.stream_playlists FOR DELETE
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Admins view all playlists"
    ON public.stream_playlists FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins create playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Admins create playlists"
    ON public.stream_playlists FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins update all playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Admins update all playlists"
    ON public.stream_playlists FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins delete playlists' AND tablename = 'stream_playlists') THEN
    CREATE POLICY "Admins delete playlists"
    ON public.stream_playlists FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 4. UPDATE EVENTS TABLE
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'livepush_stream_id') THEN
    ALTER TABLE public.events ADD COLUMN livepush_stream_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'rtmp_url') THEN
    ALTER TABLE public.events ADD COLUMN rtmp_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'stream_key') THEN
    ALTER TABLE public.events ADD COLUMN stream_key TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'livestream_status') THEN
    ALTER TABLE public.events ADD COLUMN livestream_status TEXT DEFAULT 'scheduled';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'multistream_destinations') THEN
    ALTER TABLE public.events ADD COLUMN multistream_destinations JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'approval_status') THEN
    ALTER TABLE public.events ADD COLUMN approval_status TEXT DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'approved_by') THEN
    ALTER TABLE public.events ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'qr_code_enabled') THEN
    ALTER TABLE public.events ADD COLUMN qr_code_enabled BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'qr_code_position') THEN
    ALTER TABLE public.events ADD COLUMN qr_code_position TEXT DEFAULT 'bottom-right';
  END IF;
END $$;


-- 5. DJ FEATURES: TRACKLISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stream_tracklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES stream_playlists(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  track_number INTEGER NOT NULL,
  artist_name TEXT NOT NULL,
  track_name TEXT NOT NULL,
  label TEXT,
  timestamp_seconds INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stream_tracklists ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own tracklists' AND tablename = 'stream_tracklists') THEN
    CREATE POLICY "Artists view own tracklists"
    ON public.stream_tracklists FOR SELECT
    USING (
      (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
      OR
      (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists manage own tracklists' AND tablename = 'stream_tracklists') THEN
    CREATE POLICY "Artists manage own tracklists"
    ON public.stream_tracklists FOR ALL
    USING (
      (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
      OR
      (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all tracklists' AND tablename = 'stream_tracklists') THEN
    CREATE POLICY "Admins view all tracklists"
    ON public.stream_tracklists FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 6. DJ FEATURES: TIMESTAMP MARKERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stream_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES stream_playlists(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  label TEXT NOT NULL,
  marker_type TEXT DEFAULT 'highlight',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stream_markers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own markers' AND tablename = 'stream_markers') THEN
    CREATE POLICY "Artists view own markers"
    ON public.stream_markers FOR SELECT
    USING (
      (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
      OR
      (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists manage own markers' AND tablename = 'stream_markers') THEN
    CREATE POLICY "Artists manage own markers"
    ON public.stream_markers FOR ALL
    USING (
      (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
      OR
      (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all markers' AND tablename = 'stream_markers') THEN
    CREATE POLICY "Admins view all markers"
    ON public.stream_markers FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 7. DJ FEATURES: DONATION ALERTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stream_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES stream_playlists(id),
  event_id UUID REFERENCES events(id),
  artist_id UUID REFERENCES artists(id) NOT NULL,
  donor_name TEXT DEFAULT 'Anonymous',
  amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  shown_on_stream BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stream_donations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own donations' AND tablename = 'stream_donations') THEN
    CREATE POLICY "Artists view own donations"
    ON public.stream_donations FOR SELECT
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert donations' AND tablename = 'stream_donations') THEN
    CREATE POLICY "System can insert donations"
    ON public.stream_donations FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all donations' AND tablename = 'stream_donations') THEN
    CREATE POLICY "Admins view all donations"
    ON public.stream_donations FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 8. ADMIN NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  in_app_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view own notifications' AND tablename = 'admin_notifications') THEN
    CREATE POLICY "Admins view own notifications"
    ON public.admin_notifications FOR SELECT
    USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert notifications' AND tablename = 'admin_notifications') THEN
    CREATE POLICY "System can insert notifications"
    ON public.admin_notifications FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins update own notifications' AND tablename = 'admin_notifications') THEN
    CREATE POLICY "Admins update own notifications"
    ON public.admin_notifications FOR UPDATE
    USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 9. ADMIN NOTIFICATION PREFERENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  email_address TEXT DEFAULT 'colleen.nagle@subamerica.net',
  phone_number TEXT DEFAULT '415-410-5329',
  
  notify_playlist_approval BOOLEAN DEFAULT true,
  notify_copyright_detected BOOLEAN DEFAULT true,
  notify_stream_flagged BOOLEAN DEFAULT true,
  notify_artist_limit_reached BOOLEAN DEFAULT false,
  notify_tier_change BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view own preferences' AND tablename = 'admin_notification_preferences') THEN
    CREATE POLICY "Admins view own preferences"
    ON public.admin_notification_preferences FOR SELECT
    USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins update own preferences' AND tablename = 'admin_notification_preferences') THEN
    CREATE POLICY "Admins update own preferences"
    ON public.admin_notification_preferences FOR UPDATE
    USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Insert default preferences for first admin
INSERT INTO public.admin_notification_preferences (
  admin_id,
  email_address,
  phone_number
) VALUES (
  '9671a111-2089-40ce-a497-3a043c12ae67',
  'colleen.nagle@subamerica.net',
  '415-410-5329'
)
ON CONFLICT (admin_id) DO NOTHING;


-- 10. SUBSCRIPTION HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) NOT NULL,
  tier subscription_tier NOT NULL,
  action TEXT NOT NULL,
  previous_tier subscription_tier,
  amount_paid NUMERIC(10,2),
  stripe_invoice_id TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Artists view own subscription history' AND tablename = 'subscription_history') THEN
    CREATE POLICY "Artists view own subscription history"
    ON public.subscription_history FOR SELECT
    USING (is_artist_owner(artist_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all subscription history' AND tablename = 'subscription_history') THEN
    CREATE POLICY "Admins view all subscription history"
    ON public.subscription_history FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;


-- 11. TRIGGERS FOR UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS update_livepush_permissions_updated_at ON livepush_artist_permissions;
CREATE TRIGGER update_livepush_permissions_updated_at
  BEFORE UPDATE ON livepush_artist_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_livepush_videos_updated_at ON livepush_videos;
CREATE TRIGGER update_livepush_videos_updated_at
  BEFORE UPDATE ON livepush_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stream_playlists_updated_at ON stream_playlists;
CREATE TRIGGER update_stream_playlists_updated_at
  BEFORE UPDATE ON stream_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_notification_preferences_updated_at ON admin_notification_preferences;
CREATE TRIGGER update_admin_notification_preferences_updated_at
  BEFORE UPDATE ON admin_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();