-- Create Order Queue System for handling orders when no drivers are available
-- ========================================================================

-- Create order_queue table
CREATE TABLE IF NOT EXISTS order_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'waiting_for_driver',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_queue_status ON order_queue(status);
CREATE INDEX IF NOT EXISTS idx_order_queue_created_at ON order_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Enable RLS
ALTER TABLE order_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_queue
CREATE POLICY "Drivers can view queued orders" ON order_queue
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'driver'
        )
    );

CREATE POLICY "Admins can manage order queue" ON order_queue
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- RLS Policies for admin_notifications
CREATE POLICY "Admins can view admin notifications" ON admin_notifications
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

CREATE POLICY "System can create admin notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update admin notifications" ON admin_notifications
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON order_queue TO authenticated;
GRANT ALL ON admin_notifications TO authenticated;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_order_queue_updated_at
    BEFORE UPDATE ON order_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_notifications_updated_at
    BEFORE UPDATE ON admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for order queue with order details
CREATE OR REPLACE VIEW order_queue_with_details AS
SELECT 
    oq.id as queue_id,
    oq.status as queue_status,
    oq.priority,
    oq.created_at as queued_at,
    oq.updated_at as queue_updated_at,
    o.id as order_id,
    o.customer_name,
    o.pickup_address,
    o.delivery_address,
    o.total,
    o.created_at as order_created_at,
    EXTRACT(EPOCH FROM (NOW() - oq.created_at))/60 as minutes_waiting
FROM order_queue oq
JOIN orders o ON oq.order_id = o.id
WHERE oq.status = 'waiting_for_driver'
ORDER BY oq.created_at ASC;

-- Grant permissions on the view
GRANT SELECT ON order_queue_with_details TO authenticated;

-- Create function to clean up old queue entries
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete queue entries older than 24 hours that are still waiting
    DELETE FROM order_queue 
    WHERE status = 'waiting_for_driver' 
    AND created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Update corresponding orders to expired status
    UPDATE orders 
    SET status = 'expired_no_driver', 
        updated_at = NOW()
    WHERE id IN (
        SELECT order_id FROM order_queue 
        WHERE status = 'waiting_for_driver' 
        AND created_at < NOW() - INTERVAL '24 hours'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get queue statistics
CREATE OR REPLACE FUNCTION get_order_queue_stats()
RETURNS TABLE(
    waiting_count INTEGER,
    assigned_count INTEGER,
    total_count INTEGER,
    oldest_waiting_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'waiting_for_driver')::INTEGER as waiting_count,
        COUNT(*) FILTER (WHERE status = 'assigned')::INTEGER as assigned_count,
        COUNT(*)::INTEGER as total_count,
        COALESCE(EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))/60, 0)::INTEGER as oldest_waiting_minutes
    FROM order_queue
    WHERE created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_queue_entries() TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_queue_stats() TO authenticated;

COMMENT ON TABLE order_queue IS 'Queue for orders waiting for drivers when none are online';
COMMENT ON TABLE admin_notifications IS 'Notifications for admin when no drivers are available';
COMMENT ON VIEW order_queue_with_details IS 'Order queue with full order details and wait times';
COMMENT ON FUNCTION cleanup_old_queue_entries() IS 'Cleans up old queue entries and marks orders as expired';
COMMENT ON FUNCTION get_order_queue_stats() IS 'Returns statistics about the order queue';
