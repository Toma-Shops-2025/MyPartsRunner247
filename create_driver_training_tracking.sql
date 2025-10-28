-- Driver Training Completion Tracking
-- ===================================

-- Create driver training completion table
CREATE TABLE IF NOT EXISTS driver_training_completion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL,
    video_title VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_percentage INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_driver_training_user_id ON driver_training_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_training_video_id ON driver_training_completion(video_id);
CREATE INDEX IF NOT EXISTS idx_driver_training_completed_at ON driver_training_completion(completed_at);

-- Create view for training progress
CREATE OR REPLACE VIEW driver_training_progress AS
SELECT 
    user_id,
    COUNT(*) as videos_completed,
    COUNT(DISTINCT video_id) as unique_videos_completed,
    MIN(completed_at) as first_completion,
    MAX(completed_at) as last_completion,
    AVG(progress_percentage) as average_progress
FROM driver_training_completion
GROUP BY user_id;

-- RLS Policies
ALTER TABLE driver_training_completion ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own training completion
CREATE POLICY "Drivers can view their own training completion" ON driver_training_completion
    FOR SELECT USING (auth.uid() = user_id);

-- Drivers can insert their own training completion
CREATE POLICY "Drivers can insert their own training completion" ON driver_training_completion
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drivers can update their own training completion
CREATE POLICY "Drivers can update their own training completion" ON driver_training_completion
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all training completion
CREATE POLICY "Admins can view all training completion" ON driver_training_completion
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Function to get driver training status
CREATE OR REPLACE FUNCTION get_driver_training_status(driver_user_id UUID)
RETURNS TABLE (
    total_videos INTEGER,
    completed_videos INTEGER,
    completion_percentage INTEGER,
    is_fully_completed BOOLEAN,
    last_completion_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        5 as total_videos, -- Total number of training videos
        COALESCE(COUNT(dtc.video_id), 0)::INTEGER as completed_videos,
        CASE 
            WHEN COUNT(dtc.video_id) = 0 THEN 0
            ELSE ROUND((COUNT(dtc.video_id)::DECIMAL / 5) * 100)::INTEGER
        END as completion_percentage,
        (COUNT(dtc.video_id) = 5) as is_fully_completed,
        MAX(dtc.completed_at) as last_completion_date
    FROM driver_training_completion dtc
    WHERE dtc.user_id = driver_user_id;
END;
$$ LANGUAGE plpgsql;
