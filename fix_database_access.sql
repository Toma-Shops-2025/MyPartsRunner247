-- Fix database access issues for MyPartsRunner
-- Run this in your Supabase SQL Editor

-- 1. Ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_type TEXT DEFAULT 'customer',
    full_name TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'inactive',
    is_online BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    date_of_birth DATE,
    ssn_last_four TEXT,
    driver_license TEXT,
    driver_license_exp DATE,
    vehicle_info JSONB,
    insurance_info JSONB,
    banking_info JSONB,
    address JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 4. Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- 6. Test the setup by creating a test profile (optional)
-- This will help verify that the setup is working
-- INSERT INTO profiles (id, user_type, full_name, email) 
-- VALUES (auth.uid(), 'customer', 'Test User', auth.email())
-- ON CONFLICT (id) DO UPDATE SET 
--     user_type = EXCLUDED.user_type,
--     full_name = EXCLUDED.full_name,
--     email = EXCLUDED.email;
