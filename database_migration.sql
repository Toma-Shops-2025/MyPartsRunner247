-- Add missing columns to orders table for tipping functionality

-- Add tip_amount column (required for post-delivery tipping)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;

-- Add tip_type column for tracking tip method (optional)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_type VARCHAR(50) DEFAULT 'none';

-- Update existing orders to have tip_amount = 0 if NULL
UPDATE orders SET tip_amount = 0 WHERE tip_amount IS NULL;

-- Update existing orders to have tip_type = 'none' if NULL  
UPDATE orders SET tip_type = 'none' WHERE tip_type IS NULL;

-- Add driver location tracking columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10,8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_lng DECIMAL(11,8);

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('tip_amount', 'tip_type');

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('current_lat', 'current_lng');
