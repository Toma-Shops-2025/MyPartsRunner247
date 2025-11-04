-- Fix driver_availability sync with profiles.is_online
-- This ensures driver_availability.is_online matches profiles.is_online

-- First, sync driver_availability with profiles for all drivers
UPDATE driver_availability da
SET 
  is_online = p.is_online,
  is_available = p.is_online,
  last_seen = NOW()
FROM profiles p
WHERE da.driver_id = p.id
  AND p.user_type = 'driver'
  AND (da.is_online != p.is_online OR da.is_available != p.is_online);

-- Create or update drivers who don't have a driver_availability record yet
INSERT INTO driver_availability (driver_id, is_online, is_available, max_orders, current_orders, last_seen)
SELECT 
  id,
  COALESCE(is_online, false),
  COALESCE(is_online, false),
  3,
  0,
  NOW()
FROM profiles
WHERE user_type = 'driver'
  AND id NOT IN (SELECT driver_id FROM driver_availability)
ON CONFLICT (driver_id) DO NOTHING;

-- Create a function to automatically sync driver_availability when profiles.is_online changes
CREATE OR REPLACE FUNCTION sync_driver_availability_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if is_online changed
  IF OLD.is_online IS DISTINCT FROM NEW.is_online THEN
    -- Update or insert driver_availability record
    INSERT INTO driver_availability (driver_id, is_online, is_available, max_orders, current_orders, last_seen)
    VALUES (
      NEW.id,
      NEW.is_online,
      NEW.is_online,
      3,
      0,
      NOW()
    )
    ON CONFLICT (driver_id) 
    DO UPDATE SET
      is_online = NEW.is_online,
      is_available = NEW.is_online,
      last_seen = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync when profiles.is_online changes
DROP TRIGGER IF EXISTS sync_driver_availability_trigger ON profiles;
CREATE TRIGGER sync_driver_availability_trigger
  AFTER UPDATE OF is_online ON profiles
  FOR EACH ROW
  WHEN (NEW.user_type = 'driver')
  EXECUTE FUNCTION sync_driver_availability_on_profile_update();

-- Verify the sync
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.is_online as profiles_is_online,
  da.is_online as availability_is_online,
  CASE 
    WHEN p.is_online = da.is_online THEN '✅ Synced'
    ELSE '❌ Mismatch'
  END as sync_status
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver'
ORDER BY p.full_name;

