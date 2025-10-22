-- Create driver payment method tables
-- ===================================

-- Create driver_payment_methods table
CREATE TABLE IF NOT EXISTS driver_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank', 'debit', 'cashapp', 'paypal')),
    payment_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create driver_payments table for payment history
CREATE TABLE IF NOT EXISTS driver_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_payment_methods_user_id ON driver_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_payment_methods_method ON driver_payment_methods(payment_method);
CREATE INDEX IF NOT EXISTS idx_driver_payments_driver_id ON driver_payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_payments_order_id ON driver_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_payments_status ON driver_payments(status);
CREATE INDEX IF NOT EXISTS idx_driver_payments_created_at ON driver_payments(created_at);

-- Enable RLS
ALTER TABLE driver_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Drivers can manage own payment methods" ON driver_payment_methods
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view own payments" ON driver_payments
    FOR SELECT USING (auth.uid() = driver_id);

-- Grant permissions
GRANT ALL ON driver_payment_methods TO authenticated;
GRANT ALL ON driver_payments TO authenticated;
