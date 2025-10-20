-- Add new columns to artist_verification_requests for three-tier workflow
ALTER TABLE artist_verification_requests
ADD COLUMN verification_method TEXT DEFAULT 'follower_threshold' CHECK (verification_method IN ('follower_threshold', 'platform_verified')),
ADD COLUMN verified_platforms TEXT[] DEFAULT '{}',
ADD COLUMN admin_reviewed_at TIMESTAMPTZ,
ADD COLUMN admin_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN admin_review_notes TEXT,
ADD COLUMN final_reviewed_at TIMESTAMPTZ,
ADD COLUMN final_reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN final_review_notes TEXT;

-- Create production_managers table
CREATE TABLE production_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on production_managers
ALTER TABLE production_managers ENABLE ROW LEVEL SECURITY;

-- Only admins can view production managers
CREATE POLICY "Admins can view production managers"
  ON production_managers FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert production managers
CREATE POLICY "Admins can insert production managers"
  ON production_managers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Production managers can view requests pending their approval
CREATE POLICY "Production managers view pending final approval"
  ON artist_verification_requests FOR SELECT
  USING (
    status = 'admin_approved' 
    AND has_role(auth.uid(), 'production_manager')
  );

-- Production managers can update requests pending their approval
CREATE POLICY "Production managers update pending requests"
  ON artist_verification_requests FOR UPDATE
  USING (
    status = 'admin_approved' 
    AND has_role(auth.uid(), 'production_manager')
  );