-- Create push_subscriptions table to store browser push endpoints
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their own subscription rows
CREATE POLICY IF NOT EXISTS "select own subscriptions" ON push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "insert own subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "update own subscriptions" ON push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "delete own subscriptions" ON push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_push_subscriptions_updated ON push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_updated
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

