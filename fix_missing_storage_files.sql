-- Fix missing storage files by ensuring the bucket exists and files can be uploaded
-- This addresses the "Object not found" error

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false, -- Private bucket for security
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Check what documents exist in the database
SELECT 
  id,
  user_id,
  document_type,
  file_path,
  file_name,
  status,
  uploaded_at
FROM driver_documents 
WHERE status IN ('pending_review', 'uploaded')
ORDER BY uploaded_at DESC;

-- 3. Note: The actual files need to be re-uploaded through the application
-- This SQL only creates the bucket - the files themselves need to be uploaded again
