-- Fix 406 error for driver_applications table (simplified)
-- =======================================================

-- Drop and recreate the table to ensure it's properly set up
DROP TABLE IF EXISTS driver_applications CASCADE;

CREATE TABLE driver_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Enable read access for authenticated users" ON driver_applications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON driver_applications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON driver_applications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON driver_applications TO authenticated;
GRANT ALL ON driver_applications TO anon;

-- Insert a driver application for Marcia (without ON CONFLICT)
INSERT INTO driver_applications (user_id, verification_deadline, status)
SELECT 
    p.id,
    NOW() + INTERVAL '7 days' as verification_deadline,
    'approved' as status
FROM profiles p
WHERE p.user_type = 'driver'
AND p.email = 'timandmarciaadkins@gmail.com';

-- Show results
SELECT 
    'Table Created' as status,
    'driver_applications' as table_name

UNION ALL

SELECT 
    'Records Inserted' as status,
    COUNT(*)::TEXT as table_name
FROM driver_applications;
