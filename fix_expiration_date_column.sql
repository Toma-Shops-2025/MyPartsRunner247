-- Fix missing expiration_date column in driver_documents table
-- ==========================================================

-- Add expiration_date column to driver_documents table
ALTER TABLE driver_documents 
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Recreate the driver_document_status view with proper column check
CREATE OR REPLACE VIEW driver_document_status AS
SELECT 
    dd.user_id,
    dd.document_type,
    dd.status,
    dd.file_name,
    dd.file_size,
    dd.created_at,
    dd.verified_at,
    dd.admin_notes,
    dd.expiration_date
FROM driver_documents dd
WHERE dd.user_id IS NOT NULL;

-- Show results
SELECT 
    'Added Column' as action,
    'expiration_date to driver_documents' as details

UNION ALL

SELECT 
    'Updated View' as action,
    'driver_document_status' as details;
