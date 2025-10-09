-- Create security definer function to prevent recursive RLS policies
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

-- Replace recursive RLS policies with security definer function
-- Events table
DROP POLICY IF EXISTS "Artists can view their own events" ON events;
DROP POLICY IF EXISTS "Artists can insert their own events" ON events;
DROP POLICY IF EXISTS "Artists can update their own events" ON events;
DROP POLICY IF EXISTS "Artists can delete their own events" ON events;

CREATE POLICY "Artists can view their own events"
ON events FOR SELECT TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own events"
ON events FOR INSERT TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own events"
ON events FOR UPDATE TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own events"
ON events FOR DELETE TO authenticated
USING (public.is_artist_owner(artist_id));

-- Products table
DROP POLICY IF EXISTS "Artists can view their own products" ON products;
DROP POLICY IF EXISTS "Artists can insert their own products" ON products;
DROP POLICY IF EXISTS "Artists can update their own products" ON products;
DROP POLICY IF EXISTS "Artists can delete their own products" ON products;

CREATE POLICY "Artists can view their own products"
ON products FOR SELECT TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own products"
ON products FOR INSERT TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own products"
ON products FOR UPDATE TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own products"
ON products FOR DELETE TO authenticated
USING (public.is_artist_owner(artist_id));

-- Videos table
DROP POLICY IF EXISTS "Artists can view their own videos" ON videos;
DROP POLICY IF EXISTS "Artists can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Artists can update their own videos" ON videos;
DROP POLICY IF EXISTS "Artists can delete their own videos" ON videos;

CREATE POLICY "Artists can view their own videos"
ON videos FOR SELECT TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own videos"
ON videos FOR INSERT TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own videos"
ON videos FOR UPDATE TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can delete their own videos"
ON videos FOR DELETE TO authenticated
USING (public.is_artist_owner(artist_id));

-- Payments table
DROP POLICY IF EXISTS "Artists can view their own payments" ON payments;
DROP POLICY IF EXISTS "Artists can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Artists can update their own payments" ON payments;

CREATE POLICY "Artists can view their own payments"
ON payments FOR SELECT TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own payments"
ON payments FOR INSERT TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own payments"
ON payments FOR UPDATE TO authenticated
USING (public.is_artist_owner(artist_id));

-- Port settings table
DROP POLICY IF EXISTS "Artists can insert their own port settings" ON port_settings;
DROP POLICY IF EXISTS "Artists can update their own port settings" ON port_settings;

CREATE POLICY "Artists can insert their own port settings"
ON port_settings FOR INSERT TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own port settings"
ON port_settings FOR UPDATE TO authenticated
USING (public.is_artist_owner(artist_id));

-- QR settings table
DROP POLICY IF EXISTS "Artists can view their own QR settings" ON qr_settings;
DROP POLICY IF EXISTS "Artists can insert their own QR settings" ON qr_settings;
DROP POLICY IF EXISTS "Artists can update their own QR settings" ON qr_settings;

CREATE POLICY "Artists can view their own QR settings"
ON qr_settings FOR SELECT TO authenticated
USING (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can insert their own QR settings"
ON qr_settings FOR INSERT TO authenticated
WITH CHECK (public.is_artist_owner(artist_id));

CREATE POLICY "Artists can update their own QR settings"
ON qr_settings FOR UPDATE TO authenticated
USING (public.is_artist_owner(artist_id));