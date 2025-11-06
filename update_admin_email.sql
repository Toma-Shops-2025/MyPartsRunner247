-- Update Admin Email Address
-- This script updates the admin email from infomypartsrunner@gmail.com to toma@mypartsrunner.com
-- 
-- IMPORTANT: The auth.users table email must be updated separately via Supabase Dashboard or Admin API
-- This script only updates the profiles table

-- Step 1: Check current admin user
SELECT id, email, full_name, user_type, created_at 
FROM profiles 
WHERE email = 'infomypartsrunner@gmail.com' OR email = 'toma@mypartsrunner.com';

-- Step 2: Update the profiles table email
UPDATE profiles 
SET email = 'toma@mypartsrunner.com',
    updated_at = NOW()
WHERE email = 'infomypartsrunner@gmail.com';

-- Step 3: Verify the update
SELECT id, email, full_name, user_type, created_at, updated_at
FROM profiles 
WHERE email = 'toma@mypartsrunner.com' OR email = 'infomypartsrunner@gmail.com';

-- Step 4: Check if there are any other references to the old email
SELECT 'profiles' as table_name, COUNT(*) as count
FROM profiles 
WHERE email = 'infomypartsrunner@gmail.com'
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as count
FROM orders 
WHERE customer_id IN (SELECT id FROM profiles WHERE email = 'infomypartsrunner@gmail.com')
   OR driver_id IN (SELECT id FROM profiles WHERE email = 'infomypartsrunner@gmail.com');

