-- Fix RLS policies for automation_logs table
-- This will allow the automation system to log events properly

-- First, let's check if RLS is enabled on automation_logs
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'automation_logs';

-- Enable RLS if not already enabled
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for automation_logs table
-- Allow system to insert automation logs (for order processing)
CREATE POLICY "System can insert automation logs" ON automation_logs
  FOR INSERT WITH CHECK (true);

-- Allow system to read automation logs (for debugging and monitoring)
CREATE POLICY "System can read automation logs" ON automation_logs
  FOR SELECT USING (true);

-- Allow system to update automation logs (for status updates)
CREATE POLICY "System can update automation logs" ON automation_logs
  FOR UPDATE USING (true);

-- Allow system to delete automation logs (for cleanup)
CREATE POLICY "System can delete automation logs" ON automation_logs
  FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'automation_logs';

-- Test insert to make sure it works
INSERT INTO automation_logs (order_id, action, details, status)
VALUES (
  (SELECT id FROM orders LIMIT 1), -- Use an existing order ID
  'test_insert',
  '{"test": true}',
  'success'
);

-- Clean up test record
DELETE FROM automation_logs WHERE action = 'test_insert';
