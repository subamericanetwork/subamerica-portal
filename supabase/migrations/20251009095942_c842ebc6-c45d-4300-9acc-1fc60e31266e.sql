-- Fix 1: Secure the videos storage bucket
-- Make the bucket private to prevent unauthorized access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'videos';

-- Fix 2: Replace existing storage policies with secure versions
-- Drop existing storage policies
DROP POLICY IF EXISTS "Artists can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Artists can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Artists can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view published videos" ON storage.objects;
DROP POLICY IF EXISTS "Artists can manage their videos" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Artists can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Artists can update their videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Artists can delete their videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view published videos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM videos v
    WHERE v.video_url LIKE '%' || name || '%'
    AND v.published_at IS NOT NULL
  )
);

-- Fix 3: Create security definer function to prevent recursive RLS policies
CREATE OR REPLACE FUNCTION public.is_artist_owner(_artist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM artists
    WHERE id = _artist_id
    AND user_id = auth.uid()
  )
$$;

-- Fix 4: Replace recursive RLS policies with security definer function
-- Events table policies
DROP POLICY IF EXISTS "Artists can view their own events" ON events;
DROP POLICY IF EXISTS "Artists can insert their own events" ON events;
DROP POLICY IF EXISTS "Artists can update their own events" ON events;
DROP POLICY IF EXISTS "Artists can delete their own events" ON events;

CREATE POLICY "Artists can view their own events"
ON events FOR SELECT
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own events"
ON events FOR INSERT
TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own events"
ON events FOR UPDATE
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own events"
ON events FOR DELETE
TO authenticated
USING (public.is_artist_owner(artist_id));

-- Products table policies
DROP POLICY IF EXISTS "Artists can view their own products" ON products;
DROP POLICY IF EXISTS "Artists can insert their own products" ON products;
DROP POLICY IF EXISTS "Artists can update their own products" ON products;
DROP POLICY IF EXISTS "Artists can delete their own products" ON products;

CREATE POLICY "Artists can view their own products"
ON products FOR SELECT
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own products"
ON products FOR INSERT
TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own products"
ON products FOR UPDATE
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own products"
ON products FOR DELETE
TO authenticated
USING (public.is_artist_owner(artist_id));

-- Videos table policies
DROP POLICY IF EXISTS "Artists can view their own videos" ON videos;
DROP POLICY IF EXISTS "Artists can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Artists can update their own videos" ON videos;
DROP POLICY IF EXISTS "Artists can delete their own videos" ON videos;

CREATE POLICY "Artists can view their own videos"
ON videos FOR SELECT
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own videos"
ON videos FOR INSERT
TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own videos"
ON videos FOR UPDATE
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own videos"
ON videos FOR DELETE
TO authenticated
USING (public.is_artist_owner(artist_id));

-- Payments table policies
DROP POLICY IF EXISTS "Artists can view their own payments" ON payments;
DROP POLICY IF EXISTS "Artists can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Artists can update their own payments" ON payments;

CREATE POLICY "Artists can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own payments"
ON payments FOR UPDATE
TO authenticated
USING (public.is_artist_owner(artist_id));

-- Port settings table policies
DROP POLICY IF EXISTS "Artists can insert their own port settings" ON port_settings;
DROP POLICY IF EXISTS "Artists can update their own port settings" ON port_settings;

CREATE POLICY "Artists can insert their own port settings"
ON port_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own port settings"
ON port_settings FOR UPDATE
TO authenticated
USING (public.is_artist_owner(artist_id));

-- QR settings table policies
DROP POLICY IF EXISTS "Artists can view their own QR settings" ON qr_settings;
DROP POLICY IF EXISTS "Artists can insert their own QR settings" ON qr_settings;
DROP POLICY IF EXISTS "Artists can update their own QR settings" ON qr_settings;

CREATE POLICY "Artists can view their own QR settings"
ON qr_settings FOR SELECT
TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own QR settings"
ON qr_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own QR settings"
ON qr_settings FOR UPDATE
TO authenticated
USING (public.is_artist_owner(artist_id));