-- Update existing driver documents to approved status
-- =================================================

-- Update all uploaded documents to approved status
UPDATE driver_documents 
SET 
  status = 'approved',
  verified_at = NOW(),
  admin_notes = 'Automatically approved - updated from previous upload'
WHERE status IN ('uploaded', 'pending_review')
AND user_id IN (
  SELECT id FROM profiles WHERE user_type = 'driver'
);

-- Update profiles to mark onboarding as completed for drivers with approved documents
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
  'Updated Documents' as action,
  COUNT(*) as count
FROM driver_documents 
WHERE status = 'approved'
AND admin_notes = 'Automatically approved - updated from previous upload'

UNION ALL

SELECT 
  'Updated Profiles' as action,
  COUNT(*) as count
FROM profiles 
WHERE onboarding_completed = true
AND user_type = 'driver';
