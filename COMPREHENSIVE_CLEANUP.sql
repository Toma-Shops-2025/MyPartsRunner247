-- =============================================
-- COMPREHENSIVE DATABASE CLEANUP & OPTIMIZATION
-- =============================================

-- 1. REMOVE UNUSED COLUMNS
-- Remove is_online column since we removed it from code
ALTER TABLE profiles DROP COLUMN IF EXISTS is_online;

-- 2. OPTIMIZE PROFILES TABLE
-- Keep only essential columns
ALTER TABLE profiles 
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS ssn_last_four,
DROP COLUMN IF EXISTS driver_license,
DROP COLUMN IF EXISTS driver_license_exp,
DROP COLUMN IF EXISTS insurance_info,
DROP COLUMN IF EXISTS banking_info,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS emergency_contact;

-- 3. ENSURE ESSENTIAL COLUMNS EXIST
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS vehicle_info JSONB,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- 4. CREATE OPTIMIZED INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

-- 5. OPTIMIZE ORDERS TABLE
-- Add missing columns for better functionality
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS distance DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS driver_latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS driver_longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS pickup_latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS pickup_longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11,8);

-- 6. CREATE ORDERS INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 7. REMOVE UNUSED TABLES (if they exist)
DROP TABLE IF EXISTS driver_applications CASCADE;

-- 8. FIX RLS POLICIES
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- 9. CREATE SIMPLE, WORKING RLS POLICIES
-- Profiles policies
CREATE POLICY "Enable read access for all authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Orders policies
CREATE POLICY "Enable read access for all authenticated users" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Enable update for orders" ON orders
    FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = driver_id);

-- 10. VERIFY SETUP
SELECT 'Database cleanup completed successfully' as status;
