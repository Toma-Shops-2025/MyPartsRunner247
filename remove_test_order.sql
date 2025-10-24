-- Remove test order for tomababyshopsonline@gmail.com
-- First, let's see what orders exist for this email

-- Check if the user exists
SELECT id, email, full_name, user_type 
FROM profiles 
WHERE email = 'tomababyshopsonline@gmail.com';

-- Check orders for this user
SELECT o.id, o.status, o.created_at, o.updated_at, p.email
FROM orders o
JOIN profiles p ON o.customer_id = p.id
WHERE p.email = 'tomababyshopsonline@gmail.com'
ORDER BY o.created_at DESC;

-- Remove the test order (replace with actual order ID when found)
-- DELETE FROM orders 
-- WHERE customer_id = (
--   SELECT id FROM profiles WHERE email = 'tomababyshopsonline@gmail.com'
-- );

-- If you want to remove ALL orders for this test user:
-- DELETE FROM orders 
-- WHERE customer_id = (
--   SELECT id FROM profiles WHERE email = 'tomababyshopsonline@gmail.com'
-- );

-- If you want to remove the entire test user profile:
-- DELETE FROM profiles 
-- WHERE email = 'tomababyshopsonline@gmail.com';
