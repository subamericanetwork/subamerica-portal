-- Add RLS policy to allow admins to view all artists
CREATE POLICY "Admins can view all artists"
ON public.artists
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));