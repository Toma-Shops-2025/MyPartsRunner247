-- Setup Supabase Storage bucket and policies for driver documents
-- This fixes the "Failed to generate document URL" error

-- 1. Create the driver-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false, -- Private bucket for security
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for the bucket
-- Allow drivers to upload their own documents
CREATE POLICY "Drivers can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow drivers to view their own documents
CREATE POLICY "Drivers can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Allow admins to delete documents (for cleanup)
CREATE POLICY "Admins can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
