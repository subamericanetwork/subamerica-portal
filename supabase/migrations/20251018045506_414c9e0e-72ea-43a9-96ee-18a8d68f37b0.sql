-- Add payout tracking columns to tips table
ALTER TABLE tips 
ADD COLUMN IF NOT EXISTS artist_share NUMERIC GENERATED ALWAYS AS (amount * 0.80) STORED,
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payout_reference TEXT,
ADD COLUMN IF NOT EXISTS payout_notes TEXT;

-- Add constraint for payout status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tips_payout_status_check'
  ) THEN
    ALTER TABLE tips ADD CONSTRAINT tips_payout_status_check 
    CHECK (payout_status IN ('pending', 'processing', 'paid'));
  END IF;
END $$;

-- Create indexes for faster queries on payout status
CREATE INDEX IF NOT EXISTS idx_tips_payout_status ON tips(payout_status);
CREATE INDEX IF NOT EXISTS idx_tips_artist_payout ON tips(artist_id, payout_status);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update payout status" ON tips;

-- Add RLS policy for admins to update payout status (without IF NOT EXISTS)
CREATE POLICY "Admins can update payout status"
ON tips
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));