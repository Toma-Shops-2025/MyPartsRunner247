-- Update user profile to admin type
-- This will change the user_type from 'customer' to 'admin' for the specified email

UPDATE profiles 
SET user_type = 'admin' 
WHERE email = 'infomypartsrunner@gmail.com';

-- Verify the update
SELECT id, email, full_name, user_type, created_at 
FROM profiles 
WHERE email = 'infomypartsrunner@gmail.com';
