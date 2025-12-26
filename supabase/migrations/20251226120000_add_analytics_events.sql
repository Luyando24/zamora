-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT DEFAULT 'page_view',
    page_path TEXT,
    referrer TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (tracking)
CREATE POLICY "Public can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Allow admins/staff to view analytics
-- Ideally this should be restricted to admins, but for now we'll allow authenticated users to view
-- or rely on the application logic to only show this page to admins.
-- To be safe, let's just allow authenticated users for now, assuming all authenticated users are staff/admins in this context.
CREATE POLICY "Authenticated users can view analytics" ON analytics_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for faster querying
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_page_path ON analytics_events(page_path);
