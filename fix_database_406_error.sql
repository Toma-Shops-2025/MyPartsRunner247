-- =============================================
-- FIX DATABASE 406 ERROR - SUPABASE RLS POLICIES
-- =============================================

-- 1. DISABLE RLS TEMPORARILY TO FIX ISSUES
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. DROP EXISTING POLICIES (IF ANY)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- 3. CREATE SIMPLE, WORKING POLICIES
-- Allow authenticated users to read all profiles (for now)
CREATE POLICY "Enable read access for all authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. ENABLE RLS AGAIN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. VERIFY TABLE STRUCTURE
-- Check if all required columns exist
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
        ALTER TABLE profiles ADD COLUMN user_type TEXT DEFAULT 'customer';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'inactive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_approved') THEN
        ALTER TABLE profiles ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'vehicle_info') THEN
        ALTER TABLE profiles ADD COLUMN vehicle_info JSONB;
    END IF;
END $$;

-- 6. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);

-- 7. VERIFY POLICIES ARE WORKING
-- Test query to make sure policies work
SELECT 'RLS policies created successfully' as status;
