-- Fix RLS policies for room_types to allow management by authenticated users

-- Enable RLS just in case
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can manage property room types" ON room_types;
DROP POLICY IF EXISTS "Users can manage room types for their properties" ON room_types;
DROP POLICY IF EXISTS "Public can view room types" ON room_types;
DROP POLICY IF EXISTS "Authenticated users can view room types" ON room_types;


-- Policy for viewing room types:
-- Allow anonymous and authenticated users to view all room types.
-- This is useful for public-facing booking pages.
CREATE POLICY "Public can view all room types" ON room_types
FOR SELECT
USING (true);


-- Policy for managing room types (CUD):
-- Allow authenticated users to create, update, or delete room types
-- only for properties they have access to.
-- This relies on the RLS policies on the `properties` table.
CREATE POLICY "Users can manage room types for their properties" ON room_types
FOR ALL -- Covers INSERT, UPDATE, DELETE
TO authenticated
USING (
  property_id IN (SELECT id FROM public.properties) -- RLS on properties filters this
)
WITH CHECK (
  property_id IN (SELECT id FROM public.properties) -- RLS on properties filters this
);
