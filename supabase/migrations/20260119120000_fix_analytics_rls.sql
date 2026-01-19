-- Fix RLS policies for analytics_events to allow public inserts
-- The previous policy might have been restrictive or missing explicit role assignment

-- Enable RLS (idempotent)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public can insert analytics" ON analytics_events;
DROP POLICY IF EXISTS "Authenticated users can view analytics" ON analytics_events;

-- Allow anyone (anon + authenticated) to insert events
CREATE POLICY "Public can insert analytics" ON analytics_events
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users (admins/staff) to view events
CREATE POLICY "Authenticated users can view analytics" ON analytics_events
    FOR SELECT
    TO authenticated
    USING (true);
