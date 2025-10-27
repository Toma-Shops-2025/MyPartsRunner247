-- Create driver documents management system
-- This replaces the current localStorage-based system

-- 1. Create driver_documents table
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'driver_license', 
    'driver_license_back', 
    'insurance_certificate', 
    'vehicle_registration',
    'background_check',
    'vehicle_inspection',
    'commercial_license'
  )),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK (status IN (
    'uploaded', 
    'pending_review', 
    'approved', 
    'rejected', 
    'expired'
  )),
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_documents_user_id ON driver_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON driver_documents(status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_current ON driver_documents(is_current);
CREATE INDEX IF NOT EXISTS idx_driver_documents_expires ON driver_documents(expires_at);

-- 3. Create RLS policies
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own documents
CREATE POLICY "Drivers can view their own documents" ON driver_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Drivers can insert their own documents
CREATE POLICY "Drivers can upload their own documents" ON driver_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drivers can update their own documents
CREATE POLICY "Drivers can update their own documents" ON driver_documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents" ON driver_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Admins can update all documents
CREATE POLICY "Admins can update all documents" ON driver_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_documents_updated_at();

-- 6. Create function to handle document versioning
CREATE OR REPLACE FUNCTION handle_document_versioning()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new version of an existing document type
  IF NEW.is_current = true THEN
    -- Mark all other versions of the same document type as not current
    UPDATE driver_documents 
    SET is_current = false 
    WHERE user_id = NEW.user_id 
    AND document_type = NEW.document_type 
    AND id != NEW.id;
    
    -- Set version number
    NEW.version = (
      SELECT COALESCE(MAX(version), 0) + 1 
      FROM driver_documents 
      WHERE user_id = NEW.user_id 
      AND document_type = NEW.document_type
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for document versioning
CREATE TRIGGER handle_document_versioning_trigger
  BEFORE INSERT ON driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_document_versioning();

-- 8. Create view for current documents only
CREATE OR REPLACE VIEW current_driver_documents AS
SELECT 
  id,
  user_id,
  document_type,
  file_path,
  file_name,
  file_size,
  mime_type,
  status,
  version,
  uploaded_at,
  verified_at,
  expires_at,
  admin_notes,
  rejection_reason
FROM driver_documents
WHERE is_current = true;

-- 9. Create view for pending review documents
CREATE OR REPLACE VIEW pending_document_reviews AS
SELECT 
  dd.id,
  dd.user_id,
  p.full_name,
  p.email,
  dd.document_type,
  dd.file_name,
  dd.file_size,
  dd.uploaded_at,
  dd.admin_notes
FROM driver_documents dd
JOIN profiles p ON p.id = dd.user_id
WHERE dd.status = 'pending_review'
AND dd.is_current = true
ORDER BY dd.uploaded_at ASC;

-- 10. Grant permissions
GRANT SELECT ON current_driver_documents TO authenticated;
GRANT SELECT ON pending_document_reviews TO authenticated;
GRANT ALL ON driver_documents TO authenticated;

-- 11. Insert sample data (optional - for testing)
-- INSERT INTO driver_documents (user_id, document_type, file_path, file_name, file_size, mime_type, status)
-- VALUES 
--   ('user-id-here', 'driver_license', 'user-id-here/driver_license/license.jpg', 'license.jpg', 1024000, 'image/jpeg', 'uploaded'),
--   ('user-id-here', 'insurance_certificate', 'user-id-here/insurance_certificate/insurance.pdf', 'insurance.pdf', 2048000, 'application/pdf', 'pending_review');

-- 12. Create function to get document expiration warnings
CREATE OR REPLACE FUNCTION get_expiring_documents(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  document_type TEXT,
  file_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dd.user_id,
    p.full_name,
    p.email,
    dd.document_type,
    dd.file_name,
    dd.expires_at,
    EXTRACT(DAY FROM (dd.expires_at - NOW()))::INTEGER as days_until_expiry
  FROM driver_documents dd
  JOIN profiles p ON p.id = dd.user_id
  WHERE dd.is_current = true
  AND dd.expires_at IS NOT NULL
  AND dd.expires_at <= NOW() + INTERVAL '1 day' * days_ahead
  AND dd.status = 'approved'
  ORDER BY dd.expires_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to clean up old document versions
CREATE OR REPLACE FUNCTION cleanup_old_document_versions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old versions that are not current and older than 1 year
  DELETE FROM driver_documents 
  WHERE is_current = false 
  AND uploaded_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
