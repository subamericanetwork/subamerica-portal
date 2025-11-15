-- Create artist_streaming_credentials table for encrypted provider credentials
CREATE TABLE IF NOT EXISTS artist_streaming_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('mux', 'livepush')),
  encrypted_credentials TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id, provider)
);

-- Add streaming mode and distribution columns to artist_live_streams
ALTER TABLE artist_live_streams
ADD COLUMN IF NOT EXISTS streaming_mode TEXT NOT NULL DEFAULT 'subamerica_managed' CHECK (streaming_mode IN ('own_account', 'subamerica_managed')),
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'livepush' CHECK (provider IN ('mux', 'livepush')),
ADD COLUMN IF NOT EXISTS show_on_tv BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_on_web BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_streams_tv_feed ON artist_live_streams(status, show_on_tv) 
WHERE status = 'live' AND show_on_tv = true;

CREATE INDEX IF NOT EXISTS idx_streams_web_feed ON artist_live_streams(status, show_on_web) 
WHERE status = 'live' AND show_on_web = true;

CREATE INDEX IF NOT EXISTS idx_streams_approval_status ON artist_live_streams(approval_status, scheduled_start)
WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_credentials_artist ON artist_streaming_credentials(artist_id, is_active);

-- Enable RLS on artist_streaming_credentials
ALTER TABLE artist_streaming_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_streaming_credentials
CREATE POLICY "Artists can view their own credentials"
ON artist_streaming_credentials FOR SELECT
USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own credentials"
ON artist_streaming_credentials FOR INSERT
WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own credentials"
ON artist_streaming_credentials FOR UPDATE
USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own credentials"
ON artist_streaming_credentials FOR DELETE
USING (is_artist_owner(artist_id));

-- Add trigger for updated_at
CREATE TRIGGER update_artist_streaming_credentials_updated_at
BEFORE UPDATE ON artist_streaming_credentials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();