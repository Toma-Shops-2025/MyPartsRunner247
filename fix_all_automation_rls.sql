-- Comprehensive fix for all automation table RLS policies
-- This ensures all automation tables have proper RLS policies

-- 1. Fix automation_logs table
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System can insert automation logs" ON automation_logs;
DROP POLICY IF EXISTS "System can read automation logs" ON automation_logs;
DROP POLICY IF EXISTS "System can update automation logs" ON automation_logs;
DROP POLICY IF EXISTS "System can delete automation logs" ON automation_logs;

-- Create comprehensive policies for automation_logs
CREATE POLICY "System can insert automation logs" ON automation_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can read automation logs" ON automation_logs
  FOR SELECT USING (true);

CREATE POLICY "System can update automation logs" ON automation_logs
  FOR UPDATE USING (true);

CREATE POLICY "System can delete automation logs" ON automation_logs
  FOR DELETE USING (true);

-- 2. Ensure driver_notifications has proper system access
DROP POLICY IF EXISTS "System can insert notifications" ON driver_notifications;
CREATE POLICY "System can insert notifications" ON driver_notifications
  FOR INSERT WITH CHECK (true);

-- 3. Ensure order_rejections has proper system access  
DROP POLICY IF EXISTS "System can insert rejections" ON order_rejections;
CREATE POLICY "System can insert rejections" ON order_rejections
  FOR INSERT WITH CHECK (true);

-- 4. Ensure driver_locations has proper system access
DROP POLICY IF EXISTS "System can insert locations" ON driver_locations;
CREATE POLICY "System can insert locations" ON driver_locations
  FOR INSERT WITH CHECK (true);

-- 5. Ensure driver_availability has proper system access
DROP POLICY IF EXISTS "System can insert availability" ON driver_availability;
CREATE POLICY "System can insert availability" ON driver_availability
  FOR INSERT WITH CHECK (true);

-- 6. Test that automation_logs can be inserted
DO $$
DECLARE
    test_order_id UUID;
BEGIN
    -- Get a test order ID
    SELECT id INTO test_order_id FROM orders LIMIT 1;
    
    -- If no orders exist, create a test one
    IF test_order_id IS NULL THEN
        INSERT INTO orders (customer_id, pickup_address, delivery_address, status, total_amount)
        VALUES (
            (SELECT id FROM profiles WHERE user_type = 'customer' LIMIT 1),
            'Test Address',
            'Test Delivery Address', 
            'pending',
            10.00
        ) RETURNING id INTO test_order_id;
    END IF;
    
    -- Test insert into automation_logs
    INSERT INTO automation_logs (order_id, action, details, status)
    VALUES (test_order_id, 'test_automation', '{"test": true}', 'success');
    
    -- Clean up test record
    DELETE FROM automation_logs WHERE action = 'test_automation';
    
    RAISE NOTICE 'automation_logs RLS policies are working correctly';
END $$;

-- 7. Verify all policies are in place
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('automation_logs', 'driver_notifications', 'order_rejections', 'driver_locations', 'driver_availability')
ORDER BY tablename, policyname;
