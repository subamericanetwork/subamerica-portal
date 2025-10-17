-- Add Stripe payment fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'external',
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd';