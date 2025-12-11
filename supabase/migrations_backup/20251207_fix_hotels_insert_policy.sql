-- Fix RLS policy to allow any authenticated user to create a hotel (for onboarding)
-- This ensures that new users can set up their property.

-- 1. Add created_by column to track ownership (needed for initial visibility)
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Allow authenticated users to insert hotels
-- Drop if exists to avoid conflict
DROP POLICY IF EXISTS "Authenticated users can create hotels" ON hotels;

CREATE POLICY "Authenticated users can create hotels" ON hotels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 3. Allow users to view hotels they created (so RETURNING * works)
-- Drop if exists
DROP POLICY IF EXISTS "Users can view hotels they created" ON hotels;

CREATE POLICY "Users can view hotels they created" ON hotels
FOR SELECT USING (
  created_by = auth.uid()
);
