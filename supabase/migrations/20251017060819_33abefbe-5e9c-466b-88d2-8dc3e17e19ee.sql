-- Add Stripe ticket fields to events table
ALTER TABLE events 
ADD COLUMN ticket_type text DEFAULT 'external' CHECK (ticket_type IN ('external', 'stripe')),
ADD COLUMN ticket_price numeric,
ADD COLUMN ticket_currency text DEFAULT 'usd',
ADD COLUMN stripe_price_id text;