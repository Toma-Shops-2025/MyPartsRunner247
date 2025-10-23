-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- Update existing profiles to have null avatar_url (they'll use initials)
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url IS NULL;
