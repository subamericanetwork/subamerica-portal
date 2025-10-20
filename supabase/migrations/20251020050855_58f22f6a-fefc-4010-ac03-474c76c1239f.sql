-- Add verification columns to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_artists_verified ON artists(is_verified);

-- Table to track verification requests from artists
CREATE TABLE IF NOT EXISTS artist_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  verification_evidence JSONB,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE artist_verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification requests
CREATE POLICY "Artists can view their own verification requests"
  ON artist_verification_requests FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can create verification requests"
  ON artist_verification_requests FOR INSERT
  WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Admins can view all verification requests"
  ON artist_verification_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
  ON artist_verification_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON artist_verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON artist_verification_requests(status, requested_at DESC);