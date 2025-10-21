-- Step 2: Update all existing 'fan' roles to 'member' and create new functions/triggers
UPDATE public.user_roles SET role = 'member' WHERE role = 'fan';

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_assign_fan_role ON auth.users;
DROP FUNCTION IF EXISTS public.assign_fan_role_on_signup();

-- Create new function to assign member role on signup
CREATE OR REPLACE FUNCTION public.assign_member_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign the 'member' role to the newly created user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create new trigger to assign member role on signup
CREATE TRIGGER on_auth_user_assign_member_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_member_role_on_signup();

-- Update get_user_primary_role function to use 'member' instead of 'fan'
CREATE OR REPLACE FUNCTION public.get_user_primary_role(user_id_param uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_id_param
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'production_manager' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'artist' THEN 4
      WHEN 'member' THEN 5
      WHEN 'fan' THEN 6
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'member'::app_role);
END;
$$;