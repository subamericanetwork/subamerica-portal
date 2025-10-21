-- Phase 1: Database Schema Changes for Fan-to-Artist System

-- 1.1 Add 'fan' role to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'fan') THEN
    ALTER TYPE app_role ADD VALUE 'fan';
  END IF;
END $$;

-- 1.2 Create user_profiles table for fans (who don't have artist profiles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Auto-create user profile trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- 1.3 Create artist_applications table
CREATE TABLE IF NOT EXISTS artist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application Data
  artist_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  bio TEXT,
  why_join TEXT NOT NULL,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  scene TEXT,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Review Data
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Appeal System
  appeal_reason TEXT,
  appealed_at TIMESTAMPTZ,
  appeal_status TEXT CHECK (appeal_status IN ('pending', 'approved', 'rejected')),
  appeal_reviewed_at TIMESTAMPTZ,
  appeal_reviewed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for artist_applications
ALTER TABLE artist_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own applications"
  ON artist_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users create own applications"
  ON artist_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own applications"
  ON artist_applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all applications"
  ON artist_applications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update applications"
  ON artist_applications FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Update trigger for artist_applications
CREATE TRIGGER update_artist_applications_updated_at
  BEFORE UPDATE ON artist_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 1.4 Add moderation fields to port_settings
ALTER TABLE port_settings 
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'draft' 
    CHECK (moderation_status IN ('draft', 'pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS publish_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add moderation fields to videos
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved'
    CHECK (moderation_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add moderation fields to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending_review'
    CHECK (moderation_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add moderation fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved'
    CHECK (moderation_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Add moderation fields to artist_posts
ALTER TABLE artist_posts
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending_review'
    CHECK (moderation_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- 1.5 Create content_moderation_queue table
CREATE TABLE IF NOT EXISTS content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content Reference
  content_type TEXT NOT NULL CHECK (content_type IN ('port', 'video', 'event', 'product', 'post')),
  content_id UUID NOT NULL,
  artist_id UUID NOT NULL REFERENCES artists(id),
  
  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN ('publish', 'update', 'unpublish')),
  content_preview JSONB,
  
  -- Review Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  priority INTEGER DEFAULT 0,
  
  -- Timing
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  sla_due_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Review Notes
  moderation_notes TEXT,
  rejection_reason TEXT,
  
  -- Retraction Window
  can_retract_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for content_moderation_queue
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own queue"
  ON content_moderation_queue FOR SELECT
  TO authenticated
  USING (artist_id IN (
    SELECT id FROM artists WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins view all queue"
  ON content_moderation_queue FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update queue"
  ON content_moderation_queue FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts queue"
  ON content_moderation_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_sla ON content_moderation_queue(sla_due_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_moderation_queue_artist ON content_moderation_queue(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_applications_status ON artist_applications(status);
CREATE INDEX IF NOT EXISTS idx_artist_applications_user ON artist_applications(user_id);

-- Update trigger for content_moderation_queue
CREATE TRIGGER update_content_moderation_queue_updated_at
  BEFORE UPDATE ON content_moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 1.6 Helper Functions

-- Check if content is within 1-hour retraction window
CREATE OR REPLACE FUNCTION within_retraction_window(published_timestamp TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN published_timestamp IS NOT NULL 
    AND published_timestamp > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if artist should auto-approve (verified artists only)
CREATE OR REPLACE FUNCTION should_auto_approve_content(artist_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  artist_verified BOOLEAN;
BEGIN
  SELECT is_verified INTO artist_verified
  FROM artists
  WHERE id = artist_id_param;
  
  RETURN COALESCE(artist_verified, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get user's primary role
CREATE OR REPLACE FUNCTION get_user_primary_role(user_id_param UUID)
RETURNS app_role AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_id_param
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'production_manager' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'artist' THEN 4
      WHEN 'fan' THEN 5
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'fan'::app_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is an artist
CREATE OR REPLACE FUNCTION is_artist(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(user_id_param, 'artist'::app_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Migration: Grandfather existing artists
-- All existing users with artist profiles get 'artist' role if they don't have it
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'artist'::app_role
FROM artists
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Auto-verify all existing artists (recommended approach)
UPDATE artists
SET 
  is_verified = true,
  verified_at = NOW()
WHERE is_verified = false OR is_verified IS NULL;

-- Mark all existing content as approved
UPDATE port_settings
SET moderation_status = 'approved'
WHERE moderation_status IS NULL OR moderation_status = 'draft';

UPDATE videos 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL;

UPDATE events 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL;

UPDATE products 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL;

UPDATE artist_posts 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL;