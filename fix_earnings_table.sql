-- Quick fix for missing earnings table
-- =====================================

-- Create earnings table
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

-- Add tip columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tip_type TEXT DEFAULT 'none';

-- Create delivery_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS delivery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Drivers can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = driver_id);

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

-- Grant permissions
GRANT ALL ON earnings TO authenticated;
GRANT ALL ON delivery_photos TO authenticated;
