-- Create earnings table for driver payouts
-- This table tracks all driver earnings and their payment status

CREATE TABLE IF NOT EXISTS public.earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    transfer_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_earnings_driver_id ON earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_earnings_order_id ON earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(status);

-- Enable RLS
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Drivers can view own earnings" ON earnings;
DROP POLICY IF EXISTS "Service role can manage earnings" ON earnings;

-- Create RLS policies
-- Drivers can view their own earnings
CREATE POLICY "Drivers can view own earnings" ON earnings
    FOR SELECT USING (auth.uid() = driver_id);

-- Service role (Netlify function) can insert and update earnings
CREATE POLICY "Service role can manage earnings" ON earnings
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON earnings TO authenticated;
GRANT ALL ON earnings TO service_role;

