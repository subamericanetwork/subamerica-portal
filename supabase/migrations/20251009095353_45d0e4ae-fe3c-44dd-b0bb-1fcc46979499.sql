-- Remove the public policy that exposes all columns including email
DROP POLICY IF EXISTS "Published artists are publicly viewable (no sensitive data)" ON artists;

-- The artists table should only be queryable by:
-- 1. The artist themselves (already covered by "Artists can view their own data")
-- 2. Public users should use the artists_public view instead

-- For any public-facing queries, use the artists_public view which excludes email
-- This ensures email addresses are never exposed via the API