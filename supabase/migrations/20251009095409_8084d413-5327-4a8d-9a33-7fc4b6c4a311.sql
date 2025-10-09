-- Enable RLS on the artists_public view
ALTER VIEW public.artists_public SET (security_barrier=true);

-- Note: Views don't support RLS policies directly, but security_barrier ensures
-- the view's WHERE clause is always evaluated before any user-supplied predicates,
-- preventing data leakage. The underlying artists table already has RLS enabled.