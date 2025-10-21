-- Create trigger function to automatically assign 'fan' role on user signup
CREATE OR REPLACE FUNCTION public.assign_fan_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'fan'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to assign fan role after user creation
CREATE TRIGGER on_auth_user_assign_fan_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_fan_role_on_signup();