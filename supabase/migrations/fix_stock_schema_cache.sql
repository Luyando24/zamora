-- ==============================================================================
-- FIX: Reload Schema Cache and Verify Stock Snapshots Table
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to resolve the 
-- "Could not find the table 'public.stock_snapshots' in the schema cache" error.

-- 1. Reload the PostgREST schema cache
-- This forces the API to recognize newly created tables.
NOTIFY pgrst, 'reload schema';

-- 2. Verify the table exists (Optional, just for confirmation)
-- If the table was not created by the migration for some reason, 
-- you can uncomment the CREATE TABLE block below to create it manually.
SELECT count(*) FROM stock_snapshots;

/*
-- UNCOMMENT AND RUN IF THE TABLE IS MISSING:

CREATE TABLE IF NOT EXISTS stock_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
    snapshot_date DATE NOT NULL,
    items JSONB NOT NULL,
    total_value NUMERIC DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, snapshot_type, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_property ON stock_snapshots(property_id);
ALTER TABLE stock_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Snapshots viewable by property members"
  ON stock_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.property_id = stock_snapshots.property_id
    )
  );

CREATE POLICY "Snapshots editable by managers"
  ON stock_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.property_id = stock_snapshots.property_id
      AND profiles.role IN ('admin', 'manager', 'owner')
    )
  );
*/
