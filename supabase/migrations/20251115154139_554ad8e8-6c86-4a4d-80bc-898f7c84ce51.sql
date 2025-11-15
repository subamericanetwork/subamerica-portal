-- Step 1: Immediately upgrade all existing admin users to Trident tier
UPDATE artists
SET 
  subscription_tier = 'trident'::subscription_tier,
  streaming_minutes_included = 600,
  streaming_minutes_used = 0,
  subscription_started_at = COALESCE(subscription_started_at, NOW()),
  last_streaming_reset = NOW()
WHERE user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'admin'::app_role
)
AND subscription_tier != 'trident'::subscription_tier;

-- Step 2: Create function to auto-upgrade admin to trident when role is assigned
CREATE OR REPLACE FUNCTION auto_upgrade_admin_to_trident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new role being added is 'admin'
  IF NEW.role = 'admin'::app_role THEN
    -- Update the artist record if it exists
    UPDATE artists
    SET 
      subscription_tier = 'trident'::subscription_tier,
      streaming_minutes_included = 600,
      streaming_minutes_used = 0,
      subscription_started_at = COALESCE(subscription_started_at, NOW()),
      last_streaming_reset = NOW()
    WHERE user_id = NEW.user_id
    AND subscription_tier != 'trident'::subscription_tier;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger on user_roles INSERT
CREATE TRIGGER trigger_upgrade_admin_on_role_assignment
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION auto_upgrade_admin_to_trident();

-- Step 4: Create function to auto-upgrade new artists if they're already admins
CREATE OR REPLACE FUNCTION auto_upgrade_new_artist_if_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new artist is an admin
  IF has_role(NEW.user_id, 'admin'::app_role) THEN
    NEW.subscription_tier := 'trident'::subscription_tier;
    NEW.streaming_minutes_included := 600;
    NEW.streaming_minutes_used := 0;
    NEW.subscription_started_at := COALESCE(NEW.subscription_started_at, NOW());
    NEW.last_streaming_reset := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger on artists INSERT
CREATE TRIGGER trigger_upgrade_new_artist_if_admin
BEFORE INSERT ON artists
FOR EACH ROW
EXECUTE FUNCTION auto_upgrade_new_artist_if_admin();

-- Step 6: Create function to prevent admin downgrade
CREATE OR REPLACE FUNCTION prevent_admin_tier_downgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is an admin, ensure they stay on trident
  IF has_role(NEW.user_id, 'admin'::app_role) THEN
    IF NEW.subscription_tier != 'trident'::subscription_tier THEN
      NEW.subscription_tier := 'trident'::subscription_tier;
      NEW.streaming_minutes_included := 600;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 7: Create trigger on artists UPDATE
CREATE TRIGGER trigger_prevent_admin_downgrade
BEFORE UPDATE ON artists
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_tier_downgrade();