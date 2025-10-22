-- Create audio_tracks table
CREATE TABLE public.audio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  thumb_url TEXT,
  duration INTEGER,
  tags TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  explicit BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'ready', 'processing', 'error')),
  moderation_status TEXT NOT NULL DEFAULT 'approved',
  moderation_notes TEXT,
  moderated_by UUID,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for audio_tracks
CREATE INDEX idx_audio_tracks_artist_id ON public.audio_tracks(artist_id);
CREATE INDEX idx_audio_tracks_is_featured ON public.audio_tracks(is_featured);
CREATE INDEX idx_audio_tracks_status ON public.audio_tracks(status);

-- Enable RLS on audio_tracks
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_tracks
CREATE POLICY "Artists can view their own audio tracks"
ON public.audio_tracks
FOR SELECT
USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own audio tracks"
ON public.audio_tracks
FOR INSERT
WITH CHECK (is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own audio tracks"
ON public.audio_tracks
FOR UPDATE
USING (is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own audio tracks"
ON public.audio_tracks
FOR DELETE
USING (is_artist_owner(artist_id));

CREATE POLICY "Published audio tracks are publicly viewable"
ON public.audio_tracks
FOR SELECT
USING (
  artist_id IN (
    SELECT artist_id 
    FROM port_settings 
    WHERE publish_status = 'published'::publish_status
  )
);

CREATE POLICY "Admins can view all audio tracks"
ON public.audio_tracks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audio-files storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio-files bucket
CREATE POLICY "Artists can upload their own audio files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can update their own audio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can delete their own audio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Audio files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-files');

-- Update member_playlists to support audio
ALTER TABLE public.member_playlists
ADD COLUMN IF NOT EXISTS audio_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Update updated_at trigger for audio_tracks
CREATE TRIGGER update_audio_tracks_updated_at
BEFORE UPDATE ON public.audio_tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();