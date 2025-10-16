-- Create earnings table for tracking driver payments
CREATE TABLE IF NOT EXISTS earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add stripe_account_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Enable RLS on earnings table
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Drivers can view own earnings" ON earnings;
DROP POLICY IF EXISTS "System can insert earnings" ON earnings;
DROP POLICY IF EXISTS "System can update earnings" ON earnings;

-- Create RLS policies for earnings table
-- Drivers can view their own earnings
CREATE POLICY "Drivers can view own earnings" ON earnings
  FOR SELECT USING (auth.uid() = driver_id);

-- System can insert earnings records (for the Netlify function)
CREATE POLICY "System can insert earnings" ON earnings
  FOR INSERT WITH CHECK (true);

-- System can update earnings records
CREATE POLICY "System can update earnings" ON earnings
  FOR UPDATE USING (true);
