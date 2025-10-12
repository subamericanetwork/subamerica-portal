-- Add custom domain fields to port_settings table
ALTER TABLE public.port_settings 
ADD COLUMN custom_domain text,
ADD COLUMN custom_domain_verified boolean DEFAULT false,
ADD COLUMN custom_domain_verified_at timestamp with time zone,
ADD COLUMN custom_domain_dns_instructions jsonb;

-- Create domain_verifications table
CREATE TABLE public.domain_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  verification_token text NOT NULL,
  verification_status text DEFAULT 'pending',
  dns_check_results jsonb,
  last_checked_at timestamp with time zone,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on domain_verifications
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for domain_verifications
CREATE POLICY "Artists can view their own domain verifications"
  ON public.domain_verifications
  FOR SELECT
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own domain verifications"
  ON public.domain_verifications
  FOR INSERT
  WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own domain verifications"
  ON public.domain_verifications
  FOR UPDATE
  USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own domain verifications"
  ON public.domain_verifications
  FOR DELETE
  USING (is_artist_owner(artist_id));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_domain_verifications_updated_at
  BEFORE UPDATE ON public.domain_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to prevent duplicate custom domains
CREATE UNIQUE INDEX unique_custom_domain 
  ON public.port_settings(custom_domain) 
  WHERE custom_domain IS NOT NULL;