-- ERROR MONITORING TABLES - FREE Crash Tracking & Performance
-- ==========================================================

-- Create error_reports table
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_url TEXT NOT NULL,
  line_number INTEGER,
  column_number INTEGER,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('javascript', 'network', 'performance', 'user', 'system')),
  user_agent TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  metric_category TEXT NOT NULL CHECK (metric_category IN ('navigation', 'resource', 'paint', 'custom')),
  metric_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_reports_session_id ON error_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON error_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own error reports
CREATE POLICY "Users can view own error reports" ON error_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to see their own performance metrics
CREATE POLICY "Users can view own performance metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to insert error reports
CREATE POLICY "Service role can insert error reports" ON error_reports
  FOR INSERT WITH CHECK (true);

-- Allow service role to insert performance metrics
CREATE POLICY "Service role can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Create a view for error summary
CREATE OR REPLACE VIEW error_summary AS
SELECT 
  DATE(created_at) as date,
  severity,
  category,
  COUNT(*) as error_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM error_reports
GROUP BY DATE(created_at), severity, category
ORDER BY date DESC, severity, category;

-- Create a view for performance summary
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  DATE(created_at) as date,
  metric_name,
  metric_category,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as metric_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM performance_metrics
GROUP BY DATE(created_at), metric_name, metric_category
ORDER BY date DESC, metric_name, metric_category;

-- Create a function to clean up old data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void AS $$
BEGIN
  -- Delete error reports older than 30 days
  DELETE FROM error_reports WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete performance metrics older than 30 days
  DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleaned up old monitoring data';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON error_summary TO authenticated;
GRANT SELECT ON performance_summary TO authenticated;
