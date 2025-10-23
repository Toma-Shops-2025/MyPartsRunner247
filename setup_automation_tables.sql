-- MyPartsRunner Automation System Database Setup
-- Run this SQL in your Supabase SQL editor

-- 1. Driver Notifications Table
CREATE TABLE IF NOT EXISTS driver_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  type TEXT NOT NULL CHECK (type IN ('push', 'sms', 'email', 'in_app')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Order Rejections Table (track which drivers rejected which orders)
CREATE TABLE IF NOT EXISTS order_rejections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, driver_id)
);

-- 3. Driver Location Tracking Table
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  speed DECIMAL(8, 2),
  heading DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Automation Logs Table
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Driver Availability Table
CREATE TABLE IF NOT EXISTS driver_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  max_orders INTEGER DEFAULT 3,
  current_orders INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Update profiles table to include location and availability fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_id ON driver_notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_status ON driver_notifications(status);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_created_at ON driver_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_order_rejections_order_id ON order_rejections(order_id);
CREATE INDEX IF NOT EXISTS idx_order_rejections_driver_id ON order_rejections(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_created_at ON driver_locations(created_at);

CREATE INDEX IF NOT EXISTS idx_automation_logs_order_id ON automation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);

CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id ON driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_is_online ON driver_availability(is_online);
CREATE INDEX IF NOT EXISTS idx_driver_availability_is_available ON driver_availability(is_available);

-- 8. Create RLS policies for security
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

-- Driver notifications policies
CREATE POLICY "Drivers can view their own notifications" ON driver_notifications
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "System can insert notifications" ON driver_notifications
  FOR INSERT WITH CHECK (true);

-- Order rejections policies
CREATE POLICY "Drivers can view their own rejections" ON order_rejections
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert their own rejections" ON order_rejections
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- Driver locations policies
CREATE POLICY "Drivers can view their own locations" ON driver_locations
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert their own locations" ON driver_locations
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- Driver availability policies
CREATE POLICY "Drivers can view their own availability" ON driver_availability
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own availability" ON driver_availability
  FOR UPDATE USING (driver_id = auth.uid());

-- 9. Create functions for automation
CREATE OR REPLACE FUNCTION update_driver_location(
  p_driver_id UUID,
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_accuracy DECIMAL(8, 2) DEFAULT NULL,
  p_speed DECIMAL(8, 2) DEFAULT NULL,
  p_heading DECIMAL(8, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update driver's current location in profiles
  UPDATE profiles 
  SET 
    current_latitude = p_latitude,
    current_longitude = p_longitude,
    last_location_update = NOW()
  WHERE id = p_driver_id;
  
  -- Insert location history
  INSERT INTO driver_locations (driver_id, latitude, longitude, accuracy, speed, heading)
  VALUES (p_driver_id, p_latitude, p_longitude, p_accuracy, p_speed, p_heading);
END;
$$ LANGUAGE plpgsql;

-- Function to update driver availability
CREATE OR REPLACE FUNCTION update_driver_availability(
  p_driver_id UUID,
  p_is_online BOOLEAN,
  p_is_available BOOLEAN,
  p_max_orders INTEGER DEFAULT 3
) RETURNS VOID AS $$
BEGIN
  INSERT INTO driver_availability (driver_id, is_online, is_available, max_orders, last_seen)
  VALUES (p_driver_id, p_is_online, p_is_available, p_max_orders, NOW())
  ON CONFLICT (driver_id) 
  DO UPDATE SET 
    is_online = p_is_online,
    is_available = p_is_available,
    max_orders = p_max_orders,
    last_seen = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby drivers
CREATE OR REPLACE FUNCTION get_nearby_drivers(
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_radius_miles INTEGER DEFAULT 15
) RETURNS TABLE (
  driver_id UUID,
  distance_miles DECIMAL(8, 2),
  rating DECIMAL(3, 2),
  is_online BOOLEAN,
  is_available BOOLEAN,
  current_orders INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as driver_id,
    ROUND(
      (6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(p.current_latitude)) * 
        cos(radians(p.current_longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(p.current_latitude))
      )) * 0.621371, 2
    ) as distance_miles,
    COALESCE(p.rating, 4.0) as rating,
    COALESCE(da.is_online, FALSE) as is_online,
    COALESCE(da.is_available, FALSE) as is_available,
    COALESCE(da.current_orders, 0) as current_orders
  FROM profiles p
  LEFT JOIN driver_availability da ON p.id = da.driver_id
  WHERE p.user_type = 'driver'
    AND p.status = 'active'
    AND p.current_latitude IS NOT NULL
    AND p.current_longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(p.current_latitude)) * 
        cos(radians(p.current_longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(p.current_latitude))
      ) * 0.621371
    ) <= p_radius_miles
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for automation
CREATE OR REPLACE FUNCTION trigger_order_automation() RETURNS TRIGGER AS $$
BEGIN
  -- Log the automation trigger
  INSERT INTO automation_logs (order_id, action, details, status)
  VALUES (NEW.id, 'order_created', jsonb_build_object('status', NEW.status), 'pending');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_automation_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_automation();

-- 11. Create views for easy querying
CREATE OR REPLACE VIEW active_drivers AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.current_latitude,
  p.current_longitude,
  p.rating,
  da.is_online,
  da.is_available,
  da.current_orders,
  da.max_orders,
  da.last_seen
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver'
  AND p.status = 'active'
  AND da.is_online = TRUE;

-- 12. Insert sample data for testing
INSERT INTO driver_availability (driver_id, is_online, is_available, max_orders, current_orders)
SELECT id, TRUE, TRUE, 3, 0
FROM profiles 
WHERE user_type = 'driver' 
  AND status = 'active'
ON CONFLICT (driver_id) DO NOTHING;

-- Success message
SELECT 'MyPartsRunner Automation System setup complete!' as status;
