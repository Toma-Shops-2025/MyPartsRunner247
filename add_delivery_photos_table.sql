-- Create delivery_photos table for storing delivery photos
CREATE TABLE IF NOT EXISTS delivery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_photos_order_id ON delivery_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_photos_driver_id ON delivery_photos(driver_id);

-- Enable RLS on delivery_photos table
ALTER TABLE delivery_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for delivery_photos
CREATE POLICY "Drivers can insert delivery photos" ON delivery_photos
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can view delivery photos for their orders" ON delivery_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = delivery_photos.order_id 
            AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
        )
    );

-- Grant permissions
GRANT ALL ON delivery_photos TO authenticated;
