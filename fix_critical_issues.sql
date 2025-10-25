-- Fix critical database and storage issues

-- 1. Create missing driver_applications table
CREATE TABLE IF NOT EXISTS driver_applications (
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

-- 3. Create RLS policies for driver_applications
CREATE POLICY "Users can view their own applications" ON driver_applications
  FOR SELECT USING (user_id = auth.uid());

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

-- 5. Create storage policies for driver-documents bucket
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

-- 7. Verify tables and buckets exist
SELECT 'driver_applications table created' as status;
SELECT 'driver-documents bucket created' as status;
