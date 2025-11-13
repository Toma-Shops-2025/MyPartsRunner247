-- Add tip functionality to MY-RUNNER.COM
-- =============================================

-- 1. ADD TIP COLUMNS TO ORDERS TABLE
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tip_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tip_type TEXT DEFAULT 'none' CHECK (tip_type IN ('none', 'percentage', 'fixed', 'custom'));

-- 2. ADD TIP COLUMNS TO EARNINGS TABLE
ALTER TABLE earnings 
ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2) DEFAULT 0.00;

-- 3. CREATE TIP HISTORY TABLE (for tracking tip payments)
CREATE TABLE IF NOT EXISTS tip_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tip_amount DECIMAL(10,2) NOT NULL,
    tip_type TEXT NOT NULL CHECK (tip_type IN ('percentage', 'fixed', 'custom')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_orders_tip_amount ON orders(tip_amount);
CREATE INDEX IF NOT EXISTS idx_earnings_tip_amount ON earnings(tip_amount);
CREATE INDEX IF NOT EXISTS idx_tip_payments_order_id ON tip_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_tip_payments_driver_id ON tip_payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_tip_payments_customer_id ON tip_payments(customer_id);

-- 5. ENABLE RLS ON TIP_PAYMENTS TABLE
ALTER TABLE tip_payments ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES FOR TIP_PAYMENTS
-- Customers can view their own tip payments
CREATE POLICY "Customers can view own tip payments" ON tip_payments
    FOR SELECT USING (auth.uid() = customer_id);

-- Drivers can view tip payments for their orders
CREATE POLICY "Drivers can view own tip payments" ON tip_payments
    FOR SELECT USING (auth.uid() = driver_id);

-- Customers can insert tip payments for their orders
CREATE POLICY "Customers can create tip payments" ON tip_payments
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 7. CREATE FUNCTION TO UPDATE TIP PAYMENT STATUS
CREATE OR REPLACE FUNCTION update_tip_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tip_payments updated_at
CREATE TRIGGER update_tip_payments_updated_at 
    BEFORE UPDATE ON tip_payments 
    FOR EACH ROW EXECUTE FUNCTION update_tip_payment_status();

-- 8. GRANT PERMISSIONS
GRANT ALL ON tip_payments TO authenticated;
