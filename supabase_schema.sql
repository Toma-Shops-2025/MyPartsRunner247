-- =============================================
-- SUPABASE DATABASE SCHEMA FOR MYPARTSRUNNER
-- =============================================

-- 1. UPDATE PROFILES TABLE
-- Add missing columns to the existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS ssn_last_four TEXT,
ADD COLUMN IF NOT EXISTS driver_license TEXT,
ADD COLUMN IF NOT EXISTS driver_license_exp DATE,
ADD COLUMN IF NOT EXISTS vehicle_info JSONB,
ADD COLUMN IF NOT EXISTS insurance_info JSONB,
ADD COLUMN IF NOT EXISTS banking_info JSONB,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- 2. CREATE DRIVER_APPLICATIONS TABLE
-- Create the driver_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_info JSONB,
    vehicle_info JSONB,
    documents JSONB,
    banking_info JSONB,
    certifications JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE ORDERS TABLE (if not exists)
-- This is for the driver dashboard functionality
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    item_description TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE EARNINGS TABLE (if not exists)
-- This is for tracking driver earnings
CREATE TABLE IF NOT EXISTS earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_user_id ON driver_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_earnings_driver_id ON earnings(driver_id);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Driver Applications: Users can only see their own applications
CREATE POLICY "Users can view own applications" ON driver_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON driver_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON driver_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Orders: Users can see orders they created or are assigned to
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = driver_id);

-- Drivers can see unassigned orders (where driver_id is NULL)
CREATE POLICY "Drivers can view available orders" ON orders
    FOR SELECT USING (driver_id IS NULL AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'driver'
    ));

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can update assigned orders" ON orders
    FOR UPDATE USING (auth.uid() = driver_id);

-- Drivers can update unassigned orders (where driver_id is NULL) to accept them
CREATE POLICY "Drivers can accept unassigned orders" ON orders
    FOR UPDATE USING (driver_id IS NULL AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'driver'
    ));

-- Earnings: Drivers can only see their own earnings
CREATE POLICY "Drivers can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = driver_id);

-- 8. CREATE FUNCTIONS FOR AUTOMATIC UPDATES
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_driver_applications_updated_at 
    BEFORE UPDATE ON driver_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. INSERT SAMPLE DATA (OPTIONAL)
-- You can uncomment these if you want to add some test data

-- INSERT INTO profiles (id, user_type, full_name, status) 
-- VALUES (auth.uid(), 'customer', 'Test User', 'active')
-- ON CONFLICT (id) DO NOTHING;

-- 10. GRANT PERMISSIONS
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
