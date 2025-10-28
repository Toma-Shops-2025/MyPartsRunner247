-- Add missing onboarding columns to profiles table
-- ===============================================

-- Add onboarding_completed column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_completed_at column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add stripe_connected column (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT FALSE;

-- Update existing drivers who have approved documents to mark onboarding as completed
UPDATE profiles 
SET 
  onboarding_completed = true,
  onboarding_completed_at = NOW(),
  updated_at = NOW()
WHERE user_type = 'driver' 
AND id IN (
  SELECT DISTINCT user_id 
  FROM driver_documents 
  WHERE status = 'approved'
  AND document_type IN ('driver_license', 'insurance_certificate')
  GROUP BY user_id
  HAVING COUNT(DISTINCT document_type) >= 2
);

-- Show the results
SELECT 
  'Added Columns' as action,
  'onboarding_completed, onboarding_completed_at, stripe_connected' as details

UNION ALL

SELECT 
  'Updated Profiles' as action,
  COUNT(*)::TEXT as details
FROM profiles 
WHERE onboarding_completed = true
AND user_type = 'driver';
