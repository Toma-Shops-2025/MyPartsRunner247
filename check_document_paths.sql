-- Check what file paths are stored in the database
-- This will help us understand the expected bucket structure

SELECT 
  id,
  document_type,
  file_path,
  file_name,
  status,
  uploaded_at
FROM driver_documents 
WHERE status IN ('pending_review', 'uploaded')
ORDER BY uploaded_at DESC
LIMIT 10;
