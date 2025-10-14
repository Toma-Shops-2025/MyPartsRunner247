-- Fix MyPartsRunner Database Issues
-- Run this in your Supabase SQL Editor

-- 1. Add missing vehicle_info column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS vehicle_info JSONB;

-- 2. Add missing insurance_info column to profiles table  
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS insurance_info JSONB;

-- 3. Add missing banking_info column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banking_info JSONB;

-- 4. Add missing address column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address JSONB;

-- 5. Add missing emergency_contact column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- 6. Create vehicle-documents storage bucket
-- Note: You'll need to create this bucket manually in Supabase Storage
-- Go to Storage > Create Bucket > Name: "vehicle-documents" > Public: false

-- 7. Set up storage policies for vehicle-documents bucket
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload to vehicle-documents bucket
CREATE POLICY "Allow authenticated users to upload vehicle documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vehicle-documents' 
  AND auth.role() = 'authenticated'
);

-- Allow users to view their own vehicle documents
CREATE POLICY "Allow users to view their own vehicle documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'vehicle-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own vehicle documents
CREATE POLICY "Allow users to update their own vehicle documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vehicle-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own vehicle documents
CREATE POLICY "Allow users to delete their own vehicle documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vehicle-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 8. Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('vehicle_info', 'insurance_info', 'banking_info', 'address', 'emergency_contact');
