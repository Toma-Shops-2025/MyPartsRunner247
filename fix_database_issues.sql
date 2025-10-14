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
-- Note: Storage policies need to be created through Supabase Dashboard
-- Go to Storage > vehicle-documents bucket > Policies tab
-- Create these policies manually:

-- Policy 1: Allow authenticated users to upload
-- Name: "Allow authenticated uploads"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: true
-- WITH CHECK expression: true

-- Policy 2: Allow users to view their own files
-- Name: "Allow users to view own files"  
-- Operation: SELECT
-- Target roles: authenticated
-- USING expression: auth.uid()::text = (storage.foldername(name))[1]

-- Policy 3: Allow users to update their own files
-- Name: "Allow users to update own files"
-- Operation: UPDATE  
-- Target roles: authenticated
-- USING expression: auth.uid()::text = (storage.foldername(name))[1]

-- Policy 4: Allow users to delete their own files
-- Name: "Allow users to delete own files"
-- Operation: DELETE
-- Target roles: authenticated  
-- USING expression: auth.uid()::text = (storage.foldername(name))[1]

-- 8. Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('vehicle_info', 'insurance_info', 'banking_info', 'address', 'emergency_contact');
