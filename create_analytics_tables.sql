-- ANALYTICS TABLES - FREE Business Intelligence & Performance Tracking
-- ==================================================================

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  event_properties JSONB,
  event_url TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_metrics table for aggregated data
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  total_revenue DECIMAL DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_drivers INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  average_order_value DECIMAL DEFAULT 0,
  completion_rate DECIMAL DEFAULT 0,
  customer_satisfaction DECIMAL DEFAULT 0,
  driver_earnings DECIMAL DEFAULT 0,
  platform_fee DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_business_metrics_date ON business_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_business_metrics_created_at ON business_metrics(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own analytics events
CREATE POLICY "Users can view own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to insert analytics events
CREATE POLICY "Service role can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Allow service role to insert business metrics
CREATE POLICY "Service role can insert business metrics" ON business_metrics
  FOR INSERT WITH CHECK (true);

-- Allow service role to update business metrics
CREATE POLICY "Service role can update business metrics" ON business_metrics
  FOR UPDATE WITH CHECK (true);

-- Create a view for analytics summary
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
  DATE(created_at) as date,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
GROUP BY DATE(created_at), event_name
ORDER BY date DESC, event_name;

-- Create a view for business metrics summary
CREATE OR REPLACE VIEW business_metrics_summary AS
SELECT 
  metric_date,
  total_revenue,
  total_orders,
  total_drivers,
  total_customers,
  average_order_value,
  completion_rate,
  customer_satisfaction,
  driver_earnings,
  platform_fee
FROM business_metrics
ORDER BY metric_date DESC;

-- Create a function to calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  daily_revenue DECIMAL;
  daily_orders INTEGER;
  daily_drivers INTEGER;
  daily_customers INTEGER;
  avg_order_value DECIMAL;
  completion_rate DECIMAL;
BEGIN
  -- Calculate revenue from completed orders
  SELECT COALESCE(SUM(total), 0) INTO daily_revenue
  FROM orders 
  WHERE DATE(created_at) = target_date 
  AND status = 'delivered';

  -- Count total orders
  SELECT COUNT(*) INTO daily_orders
  FROM orders 
  WHERE DATE(created_at) = target_date;

  -- Count active drivers
  SELECT COUNT(*) INTO daily_drivers
  FROM profiles 
  WHERE user_type = 'driver' 
  AND is_approved = true;

  -- Count active customers
  SELECT COUNT(*) INTO daily_customers
  FROM profiles 
  WHERE user_type = 'customer';

  -- Calculate average order value
  IF daily_orders > 0 THEN
    avg_order_value := daily_revenue / daily_orders;
  ELSE
    avg_order_value := 0;
  END IF;

  -- Calculate completion rate
  IF daily_orders > 0 THEN
    completion_rate := (daily_orders::DECIMAL / daily_orders) * 100;
  ELSE
    completion_rate := 0;
  END IF;

  -- Insert or update daily metrics
  INSERT INTO business_metrics (
    metric_date,
    total_revenue,
    total_orders,
    total_drivers,
    total_customers,
    average_order_value,
    completion_rate,
    driver_earnings,
    platform_fee
  ) VALUES (
    target_date,
    daily_revenue,
    daily_orders,
    daily_drivers,
    daily_customers,
    avg_order_value,
    completion_rate,
    daily_revenue * 0.7, -- 70% to drivers
    daily_revenue * 0.3  -- 30% to platform
  )
  ON CONFLICT (metric_date) 
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    total_drivers = EXCLUDED.total_drivers,
    total_customers = EXCLUDED.total_customers,
    average_order_value = EXCLUDED.average_order_value,
    completion_rate = EXCLUDED.completion_rate,
    driver_earnings = EXCLUDED.driver_earnings,
    platform_fee = EXCLUDED.platform_fee,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get analytics dashboard data
CREATE OR REPLACE FUNCTION get_analytics_dashboard(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_orders INTEGER,
  total_drivers INTEGER,
  total_customers INTEGER,
  average_order_value DECIMAL,
  completion_rate DECIMAL,
  driver_earnings DECIMAL,
  platform_fee DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(bm.total_revenue), 0) as total_revenue,
    COALESCE(SUM(bm.total_orders), 0) as total_orders,
    COALESCE(MAX(bm.total_drivers), 0) as total_drivers,
    COALESCE(MAX(bm.total_customers), 0) as total_customers,
    COALESCE(AVG(bm.average_order_value), 0) as average_order_value,
    COALESCE(AVG(bm.completion_rate), 0) as completion_rate,
    COALESCE(SUM(bm.driver_earnings), 0) as driver_earnings,
    COALESCE(SUM(bm.platform_fee), 0) as platform_fee
  FROM business_metrics bm
  WHERE bm.metric_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON analytics_summary TO authenticated;
GRANT SELECT ON business_metrics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_dashboard TO authenticated;
