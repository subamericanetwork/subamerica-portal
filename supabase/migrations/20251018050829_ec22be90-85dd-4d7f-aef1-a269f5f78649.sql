-- Add payout account fields to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS payout_paypal_email text,
ADD COLUMN IF NOT EXISTS payout_venmo_email text,
ADD COLUMN IF NOT EXISTS payout_zelle_email text,
ADD COLUMN IF NOT EXISTS payout_primary_method text CHECK (payout_primary_method IN ('paypal', 'venmo', 'zelle'));

-- Drop the payments table as it's no longer needed
DROP TABLE IF EXISTS payments CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN artists.payout_primary_method IS 'Primary payout method for artist earnings: paypal, venmo, or zelle';