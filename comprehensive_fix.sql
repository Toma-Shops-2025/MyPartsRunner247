-- Comprehensive fix for all critical issues
-- Run this in your Supabase SQL editor

-- 1. Drop and recreate driver_applications table with proper structure
DROP TABLE IF EXISTS driver_applications CASCADE;

CREATE TABLE driver_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_deadline TIMESTAMP WITH TIME ZONE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- 2. Enable RLS for driver_applications
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can view their own applications" ON driver_applications;
DROP POLICY IF EXISTS "System can manage all applications" ON driver_applications;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own applications" ON driver_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own applications" ON driver_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own applications" ON driver_applications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can manage all applications" ON driver_applications
  FOR ALL USING (true);

-- 4. Create storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 5. Drop existing storage policies and create new ones
DROP POLICY IF EXISTS "Drivers can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can delete their own documents" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Drivers can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Drivers can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'driver-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_applications_user_id ON driver_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_verification_deadline ON driver_applications(verification_deadline);

-- 7. Test the setup
DO $$
BEGIN
  -- Test driver_applications table
  INSERT INTO driver_applications (user_id, status, verification_deadline, verification_status)
  VALUES (
    (SELECT id FROM profiles WHERE user_type = 'driver' LIMIT 1),
    'approved',
    NOW() + INTERVAL '7 days',
    'pending'
  );
  
  -- Clean up test data
  DELETE FROM driver_applications WHERE status = 'approved' AND verification_deadline > NOW();
  
  RAISE NOTICE 'driver_applications table is working correctly';
END $$;

-- 8. Verify everything is set up
SELECT 'Tables and buckets created successfully' as status;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'driver_applications';
SELECT * FROM storage.buckets WHERE id = 'driver-documents';
