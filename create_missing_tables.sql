-- Create missing tables and add tip functionality
-- =============================================

-- 1. CREATE EARNINGS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    base_amount DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE DELIVERY_PHOTOS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS delivery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADD TIP COLUMNS TO ORDERS TABLE
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tip_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tip_type TEXT DEFAULT 'none' CHECK (tip_type IN ('none', 'percentage', 'fixed', 'custom'));

-- 4. CREATE TIP PAYMENTS TABLE
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

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_earnings_driver_id ON earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_earnings_order_id ON earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_earnings_tip_amount ON earnings(tip_amount);
CREATE INDEX IF NOT EXISTS idx_delivery_photos_order_id ON delivery_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_photos_driver_id ON delivery_photos(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_tip_amount ON orders(tip_amount);
CREATE INDEX IF NOT EXISTS idx_tip_payments_order_id ON tip_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_tip_payments_driver_id ON tip_payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_tip_payments_customer_id ON tip_payments(customer_id);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_payments ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- Earnings: Drivers can only see their own earnings
CREATE POLICY "Drivers can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert own earnings" ON earnings
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Delivery Photos: Drivers and customers can view photos for their orders
CREATE POLICY "Users can view delivery photos for their orders" ON delivery_photos
    FOR SELECT USING (
        auth.uid() = driver_id OR 
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = delivery_photos.order_id 
            AND orders.customer_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can insert delivery photos" ON delivery_photos
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Tip Payments: Customers can view their own tip payments, drivers can view tips for their orders
CREATE POLICY "Customers can view own tip payments" ON tip_payments
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view own tip payments" ON tip_payments
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Customers can create tip payments" ON tip_payments
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 8. CREATE FUNCTION TO UPDATE TIP PAYMENT STATUS
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

-- 9. GRANT PERMISSIONS
GRANT ALL ON earnings TO authenticated;
GRANT ALL ON delivery_photos TO authenticated;
GRANT ALL ON tip_payments TO authenticated;
