-- Fix the pending_document_reviews view to include both 'uploaded' and 'pending_review' statuses
-- This addresses the issue where documents show as "pending review" to drivers but don't appear in admin dashboard

-- Update the view to include both statuses
CREATE OR REPLACE VIEW pending_document_reviews AS
SELECT 
  dd.id,
  dd.user_id,
  p.full_name,
  p.email,
  dd.document_type,
  dd.file_name,
  dd.file_size,
  dd.uploaded_at,
  dd.admin_notes
FROM driver_documents dd
JOIN profiles p ON p.id = dd.user_id
WHERE dd.status IN ('pending_review', 'uploaded')
AND dd.is_current = true
ORDER BY dd.uploaded_at ASC;

-- Also update any existing documents with 'uploaded' status to 'pending_review' for consistency
UPDATE driver_documents 
SET status = 'pending_review' 
WHERE status = 'uploaded' 
AND is_current = true;

-- Grant permissions (in case they don't exist)
GRANT SELECT ON pending_document_reviews TO authenticated;
