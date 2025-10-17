-- Create tips table to track all tip transactions
CREATE TABLE public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  artist_slug TEXT NOT NULL,
  amount NUMERIC NOT NULL, -- Amount in cents
  tipper_email TEXT NOT NULL,
  admin_email_sent BOOLEAN DEFAULT false,
  tipper_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Admins can view all tips
CREATE POLICY "Admins can view all tips"
ON public.tips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Artists can view their own tips
CREATE POLICY "Artists can view their own tips"
ON public.tips
FOR SELECT
USING (is_artist_owner(artist_id));

-- System (webhook) can insert tips
CREATE POLICY "System can insert tips"
ON public.tips
FOR INSERT
WITH CHECK (true);

-- Create index on stripe_session_id for fast lookups
CREATE INDEX idx_tips_stripe_session_id ON public.tips(stripe_session_id);

-- Create index on artist_id for artist queries
CREATE INDEX idx_tips_artist_id ON public.tips(artist_id);