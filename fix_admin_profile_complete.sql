-- Complete fix for admin profile
-- This will ensure the user is properly set as admin

-- First, let's see what's currently in the database
SELECT id, email, full_name, user_type, created_at 
FROM profiles 
WHERE email = 'infomypartsrunner@gmail.com';

-- Update the user_type to admin
UPDATE profiles 
SET user_type = 'admin',
    updated_at = NOW()
WHERE email = 'infomypartsrunner@gmail.com';

-- If the above doesn't work, try this alternative approach
-- First, get the user ID
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id FROM profiles WHERE email = 'infomypartsrunner@gmail.com';
    
    -- Update the profile
    UPDATE profiles 
    SET user_type = 'admin',
        updated_at = NOW()
    WHERE id = user_id;
    
    -- If no profile exists, create one
    IF NOT FOUND THEN
        INSERT INTO profiles (id, email, full_name, user_type, created_at, updated_at)
        VALUES (
            (SELECT id FROM auth.users WHERE email = 'infomypartsrunner@gmail.com'),
            'infomypartsrunner@gmail.com',
            'Toma Adkins',
            'admin',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Verify the final result
SELECT id, email, full_name, user_type, created_at, updated_at
FROM profiles 
WHERE email = 'infomypartsrunner@gmail.com';

-- Also check if there are any other profiles for this email
SELECT * FROM profiles WHERE email LIKE '%infomypartsrunner%';
