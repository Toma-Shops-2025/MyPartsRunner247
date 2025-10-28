-- Document Expiration Tracking System
-- ====================================

-- Add expiration date columns to driver_documents table
ALTER TABLE driver_documents 
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create document expiration tracking table
CREATE TABLE IF NOT EXISTS document_expiration_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_id UUID NOT NULL REFERENCES driver_documents(id) ON DELETE CASCADE,
    expiration_date DATE NOT NULL,
    days_until_expiry INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, renewed, suspended
    reminder_sent_30_days BOOLEAN DEFAULT FALSE,
    reminder_sent_14_days BOOLEAN DEFAULT FALSE,
    reminder_sent_7_days BOOLEAN DEFAULT FALSE,
    reminder_sent_1_day BOOLEAN DEFAULT FALSE,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_expiration_user_id ON document_expiration_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_document_expiration_status ON document_expiration_tracking(status);
CREATE INDEX IF NOT EXISTS idx_document_expiration_date ON document_expiration_tracking(expiration_date);
CREATE INDEX IF NOT EXISTS idx_document_expiration_days_until ON document_expiration_tracking(days_until_expiry);

-- Create bulk reminder tracking table
CREATE TABLE IF NOT EXISTS bulk_reminder_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reminder_type VARCHAR(50) NOT NULL, -- quarterly, annual, custom
    reminder_date DATE NOT NULL,
    total_drivers INTEGER NOT NULL,
    drivers_notified INTEGER DEFAULT 0,
    drivers_with_expiring_docs INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create driver document status view
CREATE OR REPLACE VIEW driver_document_status AS
SELECT 
    dd.user_id,
    dd.document_type,
    dd.status as document_status,
    dd.expiration_date,
    dd.created_at as document_uploaded_at,
    dd.verified_at,
    CASE 
        WHEN dd.expiration_date IS NULL THEN 'no_expiration'
        WHEN dd.expiration_date < CURRENT_DATE THEN 'expired'
        WHEN dd.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN dd.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_later'
        ELSE 'valid'
    END as expiration_status,
    CASE 
        WHEN dd.expiration_date IS NULL THEN NULL
        ELSE EXTRACT(DAYS FROM (dd.expiration_date - CURRENT_DATE))::INTEGER
    END as days_until_expiry
FROM driver_documents dd
WHERE dd.status = 'approved';

-- Create function to update document expiration tracking
CREATE OR REPLACE FUNCTION update_document_expiration_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update expiration tracking record
    INSERT INTO document_expiration_tracking (
        user_id,
        document_type,
        document_id,
        expiration_date,
        days_until_expiry,
        status
    )
    VALUES (
        NEW.user_id,
        NEW.document_type,
        NEW.id,
        NEW.expiration_date,
        CASE 
            WHEN NEW.expiration_date IS NULL THEN NULL
            ELSE EXTRACT(DAYS FROM (NEW.expiration_date - CURRENT_DATE))::INTEGER
        END,
        CASE 
            WHEN NEW.expiration_date IS NULL THEN 'no_expiration'
            WHEN NEW.expiration_date < CURRENT_DATE THEN 'expired'
            ELSE 'active'
        END
    )
    ON CONFLICT (user_id, document_type, document_id) 
    DO UPDATE SET
        expiration_date = NEW.expiration_date,
        days_until_expiry = CASE 
            WHEN NEW.expiration_date IS NULL THEN NULL
            ELSE EXTRACT(DAYS FROM (NEW.expiration_date - CURRENT_DATE))::INTEGER
        END,
        status = CASE 
            WHEN NEW.expiration_date IS NULL THEN 'no_expiration'
            WHEN NEW.expiration_date < CURRENT_DATE THEN 'expired'
            ELSE 'active'
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update expiration tracking
DROP TRIGGER IF EXISTS trigger_update_document_expiration ON driver_documents;
CREATE TRIGGER trigger_update_document_expiration
    AFTER INSERT OR UPDATE ON driver_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_expiration_tracking();

-- Create function to get drivers with expiring documents
CREATE OR REPLACE FUNCTION get_drivers_with_expiring_documents(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    document_type VARCHAR(50),
    expiration_date DATE,
    days_until_expiry INTEGER,
    phone TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        det.document_type,
        det.expiration_date,
        det.days_until_expiry,
        p.phone
    FROM document_expiration_tracking det
    JOIN profiles p ON p.id = det.user_id
    WHERE det.status = 'active'
    AND det.days_until_expiry <= days_ahead
    AND det.days_until_expiry > 0
    AND p.user_type = 'driver'
    ORDER BY det.days_until_expiry ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all drivers for bulk reminders
CREATE OR REPLACE FUNCTION get_all_active_drivers()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    has_expiring_docs BOOLEAN,
    expiring_doc_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        p.phone,
        EXISTS(
            SELECT 1 FROM document_expiration_tracking det 
            WHERE det.user_id = p.id 
            AND det.status = 'active'
            AND det.days_until_expiry <= 90
            AND det.days_until_expiry > 0
        ) as has_expiring_docs,
        ARRAY(
            SELECT det.document_type 
            FROM document_expiration_tracking det 
            WHERE det.user_id = p.id 
            AND det.status = 'active'
            AND det.days_until_expiry <= 90
            AND det.days_until_expiry > 0
        ) as expiring_doc_types
    FROM profiles p
    WHERE p.user_type = 'driver'
    AND p.status = 'active'
    ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for document_expiration_tracking
ALTER TABLE document_expiration_tracking ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own expiration tracking
CREATE POLICY "Drivers can view their own expiration tracking" ON document_expiration_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all expiration tracking
CREATE POLICY "Admins can view all expiration tracking" ON document_expiration_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- RLS Policies for bulk_reminder_tracking
ALTER TABLE bulk_reminder_tracking ENABLE ROW LEVEL SECURITY;

-- Only admins can access bulk reminder tracking
CREATE POLICY "Only admins can access bulk reminder tracking" ON bulk_reminder_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Insert sample data for testing (optional)
-- This will create tracking records for existing documents
INSERT INTO document_expiration_tracking (user_id, document_type, document_id, expiration_date, days_until_expiry, status)
SELECT 
    dd.user_id,
    dd.document_type,
    dd.id,
    dd.expiration_date,
    CASE 
        WHEN dd.expiration_date IS NULL THEN NULL
        ELSE EXTRACT(DAYS FROM (dd.expiration_date - CURRENT_DATE))::INTEGER
    END,
    CASE 
        WHEN dd.expiration_date IS NULL THEN 'no_expiration'
        WHEN dd.expiration_date < CURRENT_DATE THEN 'expired'
        ELSE 'active'
    END
FROM driver_documents dd
WHERE dd.status = 'approved'
ON CONFLICT (user_id, document_type, document_id) DO NOTHING;
