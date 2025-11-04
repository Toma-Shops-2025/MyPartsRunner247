-- Fix Marcia's online status - manually set to offline since she's logged out
UPDATE profiles
SET 
  is_online = false,
  status = 'inactive',
  updated_at = NOW()
WHERE email = 'timandmarciaadkins@gmail.com'
  AND user_type = 'driver';

-- This will automatically trigger the sync_driver_availability_trigger
-- which will update driver_availability.is_online to false as well

-- Verify the fix
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

