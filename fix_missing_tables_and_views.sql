-- Fix missing tables and views causing console errors
-- ==================================================

-- Create driver_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver_document_status view
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

-- Enable RLS on driver_applications
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_applications
CREATE POLICY "Drivers can view their own applications" ON driver_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON driver_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- RLS policies for driver_document_status view
ALTER VIEW driver_document_status SET (security_invoker = true);

-- Create a function to check if user can access document status
CREATE OR REPLACE FUNCTION can_access_document_status(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is accessing their own data or is an admin
    RETURN (
        auth.uid() = user_id_param OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON driver_document_status TO authenticated;
GRANT SELECT ON driver_applications TO authenticated;

-- Insert a sample driver application for existing drivers
INSERT INTO driver_applications (user_id, verification_deadline, status)
SELECT 
    p.id,
    NOW() + INTERVAL '7 days' as verification_deadline,
    'approved' as status
FROM profiles p
WHERE p.user_type = 'driver'
AND p.onboarding_completed = true
AND NOT EXISTS (
    SELECT 1 FROM driver_applications da 
    WHERE da.user_id = p.id
);

-- Show results
SELECT 
    'Created Tables/Views' as action,
    'driver_applications, driver_document_status' as details

UNION ALL

SELECT 
    'Inserted Applications' as action,
    COUNT(*)::TEXT as details
FROM driver_applications;
