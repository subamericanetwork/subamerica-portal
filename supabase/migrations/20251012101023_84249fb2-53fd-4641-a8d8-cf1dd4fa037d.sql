-- Add missing DJ-specific tables and admin notification system

-- 1. DJ-SPECIFIC FEATURES: TRACKLISTS
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

DROP POLICY IF EXISTS "Artists view own tracklists" ON public.stream_tracklists;
CREATE POLICY "Artists view own tracklists"
ON public.stream_tracklists FOR SELECT
USING (
  (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
  OR
  (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
);

DROP POLICY IF EXISTS "Artists manage own tracklists" ON public.stream_tracklists;
CREATE POLICY "Artists manage own tracklists"
ON public.stream_tracklists FOR ALL
USING (
  (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
  OR
  (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
);

DROP POLICY IF EXISTS "Admins view all tracklists" ON public.stream_tracklists;
CREATE POLICY "Admins view all tracklists"
ON public.stream_tracklists FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));


-- 2. DJ-SPECIFIC FEATURES: TIMESTAMP MARKERS
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

DROP POLICY IF EXISTS "Artists view own markers" ON public.stream_markers;
CREATE POLICY "Artists view own markers"
ON public.stream_markers FOR SELECT
USING (
  (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
  OR
  (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
);

DROP POLICY IF EXISTS "Artists manage own markers" ON public.stream_markers;
CREATE POLICY "Artists manage own markers"
ON public.stream_markers FOR ALL
USING (
  (stream_id IN (SELECT id FROM stream_playlists WHERE is_artist_owner(artist_id)))
  OR
  (event_id IN (SELECT id FROM events WHERE is_artist_owner(artist_id)))
);

DROP POLICY IF EXISTS "Admins view all markers" ON public.stream_markers;
CREATE POLICY "Admins view all markers"
ON public.stream_markers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));


-- 3. DJ-SPECIFIC FEATURES: DONATION ALERTS
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

DROP POLICY IF EXISTS "Artists view own donations" ON public.stream_donations;
CREATE POLICY "Artists view own donations"
ON public.stream_donations FOR SELECT
USING (is_artist_owner(artist_id));

DROP POLICY IF EXISTS "System can insert donations" ON public.stream_donations;
CREATE POLICY "System can insert donations"
ON public.stream_donations FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view all donations" ON public.stream_donations;
CREATE POLICY "Admins view all donations"
ON public.stream_donations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));


-- 4. ADMIN NOTIFICATIONS
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

DROP POLICY IF EXISTS "Admins view own notifications" ON public.admin_notifications;
CREATE POLICY "Admins view own notifications"
ON public.admin_notifications FOR SELECT
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
CREATE POLICY "System can insert notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins update own notifications" ON public.admin_notifications;
CREATE POLICY "Admins update own notifications"
ON public.admin_notifications FOR UPDATE
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));


-- 5. ADMIN NOTIFICATION PREFERENCES
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

DROP POLICY IF EXISTS "Admins view own preferences" ON public.admin_notification_preferences;
CREATE POLICY "Admins view own preferences"
ON public.admin_notification_preferences FOR SELECT
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update own preferences" ON public.admin_notification_preferences;
CREATE POLICY "Admins update own preferences"
ON public.admin_notification_preferences FOR UPDATE
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

-- Insert default preferences for first admin (will skip if exists)
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