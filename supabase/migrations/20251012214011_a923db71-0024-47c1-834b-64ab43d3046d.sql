-- Create artist_faqs table for SEO-optimized FAQ content
CREATE TABLE public.artist_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_faqs ENABLE ROW LEVEL SECURITY;

-- Artists can view their own FAQs
CREATE POLICY "Artists can view their own FAQs"
ON public.artist_faqs
FOR SELECT
USING (is_artist_owner(artist_id));

-- Artists can insert their own FAQs
CREATE POLICY "Artists can insert their own FAQs"
ON public.artist_faqs
FOR INSERT
WITH CHECK (is_artist_owner(artist_id));

-- Artists can update their own FAQs
CREATE POLICY "Artists can update their own FAQs"
ON public.artist_faqs
FOR UPDATE
USING (is_artist_owner(artist_id));

-- Artists can delete their own FAQs
CREATE POLICY "Artists can delete their own FAQs"
ON public.artist_faqs
FOR DELETE
USING (is_artist_owner(artist_id));

-- Published artist FAQs are publicly viewable
CREATE POLICY "Published artist FAQs are publicly viewable"
ON public.artist_faqs
FOR SELECT
USING (
  artist_id IN (
    SELECT artist_id 
    FROM port_settings 
    WHERE publish_status = 'published'
  )
  AND is_visible = true
);

-- Add trigger for updated_at
CREATE TRIGGER update_artist_faqs_updated_at
  BEFORE UPDATE ON public.artist_faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_artist_faqs_artist_id ON public.artist_faqs(artist_id);
CREATE INDEX idx_artist_faqs_display_order ON public.artist_faqs(artist_id, display_order);