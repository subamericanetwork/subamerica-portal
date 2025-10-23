-- Update artist_verification_requests status constraint to remove 'admin_approved'
ALTER TABLE artist_verification_requests 
DROP CONSTRAINT IF EXISTS artist_verification_requests_status_check;

ALTER TABLE artist_verification_requests 
ADD CONSTRAINT artist_verification_requests_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision'));

-- Remove RLS policies that reference 'admin_approved' status
DROP POLICY IF EXISTS "Production managers update pending requests" ON artist_verification_requests;
DROP POLICY IF EXISTS "Production managers view pending final approval" ON artist_verification_requests;