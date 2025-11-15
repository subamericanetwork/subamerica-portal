-- Create enum types for overlay system
CREATE TYPE overlay_type AS ENUM ('product', 'content', 'cta', 'info', 'poll', 'qr');
CREATE TYPE overlay_position AS ENUM ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'banner');
CREATE TYPE interaction_type AS ENUM ('view', 'click', 'dismiss');

-- Create stream_overlays table
CREATE TABLE public.stream_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.artist_live_streams(id) ON DELETE CASCADE,
  overlay_type overlay_type NOT NULL,
  trigger_time_seconds INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 15,
  position overlay_position NOT NULL DEFAULT 'bottom-right',
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  clickable BOOLEAN NOT NULL DEFAULT true,
  click_action JSONB DEFAULT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  platforms TEXT[] NOT NULL DEFAULT ARRAY['web', 'roku', 'firetv', 'appletv', 'android-tv'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_overlay_interactions table
CREATE TABLE public.stream_overlay_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overlay_id UUID NOT NULL REFERENCES public.stream_overlays(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES public.artist_live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type interaction_type NOT NULL,
  platform TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_stream_overlays_stream_id ON public.stream_overlays(stream_id);
CREATE INDEX idx_stream_overlays_trigger_time ON public.stream_overlays(trigger_time_seconds);
CREATE INDEX idx_overlay_interactions_overlay_id ON public.stream_overlay_interactions(overlay_id);
CREATE INDEX idx_overlay_interactions_stream_id ON public.stream_overlay_interactions(stream_id);

-- Enable RLS
ALTER TABLE public.stream_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_overlay_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stream_overlays
CREATE POLICY "Artists manage own stream overlays"
ON public.stream_overlays
FOR ALL
USING (
  stream_id IN (
    SELECT id FROM public.artist_live_streams 
    WHERE artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Public view stream overlays"
ON public.stream_overlays
FOR SELECT
USING (
  stream_id IN (
    SELECT id FROM public.artist_live_streams 
    WHERE status IN ('scheduled', 'live', 'ended') 
    AND (show_on_web = true OR show_on_tv = true)
  )
);

-- RLS Policies for stream_overlay_interactions
CREATE POLICY "Anyone can track interactions"
ON public.stream_overlay_interactions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Artists view own overlay interactions"
ON public.stream_overlay_interactions
FOR SELECT
USING (
  stream_id IN (
    SELECT id FROM public.artist_live_streams 
    WHERE artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_stream_overlays_updated_at
BEFORE UPDATE ON public.stream_overlays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();