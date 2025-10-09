-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE video_kind AS ENUM ('music_video', 'performance_clip', 'poem', 'short_film', 'audio_only');
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
CREATE TYPE pay_mode AS ENUM ('heartland_hosted', 'woo_heartland');
CREATE TYPE publish_status AS ENUM ('draft', 'pending', 'scheduled', 'published');

-- Artists table (profiles)
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  pronouns TEXT,
  tz TEXT DEFAULT 'America/New_York',
  bio_short TEXT,
  bio_long TEXT,
  scene TEXT,
  socials JSONB DEFAULT '{}'::JSONB,
  brand JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  kind video_kind NOT NULL,
  source TEXT DEFAULT 'upload',
  provider TEXT DEFAULT 'cloudflare',
  provider_id TEXT,
  duration INT,
  captions_url TEXT,
  thumb_url TEXT,
  explicit BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  status video_status DEFAULT 'uploading',
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  duration INT,
  venue TEXT,
  ticket_url TEXT,
  poster_url TEXT,
  livestream_source TEXT,
  geo JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (merch)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  price NUMERIC(10,2),
  sku TEXT,
  variants JSONB,
  images JSONB,
  fulfillment TEXT,
  inventory TEXT,
  pitch TEXT,
  is_surface BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL UNIQUE,
  mode pay_mode DEFAULT 'heartland_hosted',
  heartland_link TEXT,
  paypal_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Settings table
CREATE TABLE public.qr_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_action TEXT DEFAULT 'tip',
  utm_template TEXT DEFAULT 'utm_source=tv&utm_medium=qr&utm_campaign=artist_port&utm_content={slug}',
  fallback_action TEXT DEFAULT 'tip',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Port Settings table
CREATE TABLE public.port_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL UNIQUE,
  publish_status publish_status DEFAULT 'draft',
  go_live_at TIMESTAMPTZ,
  max_products INT DEFAULT 6,
  commenting TEXT DEFAULT 'off',
  pixels JSONB,
  seo JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table
CREATE TABLE public.audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  action TEXT,
  entity TEXT,
  entity_id UUID,
  diff JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.port_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artists
CREATE POLICY "Artists can view their own data"
  ON public.artists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Artists can update their own data"
  ON public.artists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Artists can insert their own data"
  ON public.artists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for videos
CREATE POLICY "Artists can view their own videos"
  ON public.videos FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own videos"
  ON public.videos FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can delete their own videos"
  ON public.videos FOR DELETE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- RLS Policies for events
CREATE POLICY "Artists can view their own events"
  ON public.events FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own events"
  ON public.events FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own events"
  ON public.events FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can delete their own events"
  ON public.events FOR DELETE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- RLS Policies for products
CREATE POLICY "Artists can view their own products"
  ON public.products FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own products"
  ON public.products FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can delete their own products"
  ON public.products FOR DELETE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Artists can view their own payments"
  ON public.payments FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own payments"
  ON public.payments FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- RLS Policies for qr_settings
CREATE POLICY "Artists can view their own QR settings"
  ON public.qr_settings FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own QR settings"
  ON public.qr_settings FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own QR settings"
  ON public.qr_settings FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- RLS Policies for port_settings
CREATE POLICY "Artists can view their own port settings"
  ON public.port_settings FOR SELECT
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own port settings"
  ON public.port_settings FOR INSERT
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own port settings"
  ON public.port_settings FOR UPDATE
  USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- Public access policies for published ports (for the WordPress integration)
CREATE POLICY "Published artists are publicly viewable"
  ON public.artists FOR SELECT
  USING (id IN (SELECT artist_id FROM public.port_settings WHERE publish_status = 'published'));

CREATE POLICY "Published videos are publicly viewable"
  ON public.videos FOR SELECT
  USING (
    artist_id IN (SELECT artist_id FROM public.port_settings WHERE publish_status = 'published')
    AND published_at IS NOT NULL
  );

CREATE POLICY "Published events are publicly viewable"
  ON public.events FOR SELECT
  USING (artist_id IN (SELECT artist_id FROM public.port_settings WHERE publish_status = 'published'));

CREATE POLICY "Published products are publicly viewable"
  ON public.products FOR SELECT
  USING (
    artist_id IN (SELECT artist_id FROM public.port_settings WHERE publish_status = 'published')
    AND is_surface = TRUE
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qr_settings_updated_at
  BEFORE UPDATE ON public.qr_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_port_settings_updated_at
  BEFORE UPDATE ON public.port_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();