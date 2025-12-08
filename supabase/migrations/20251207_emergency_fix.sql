-- EMERGENCY FIX: Reset Policies and Permissions
-- Run this to fix "No properties found" and "Infinite Recursion" errors once and for all.

-- 1. Create the safety function (idempotent)
CREATE OR REPLACE FUNCTION is_property_owner(check_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM properties 
    WHERE id = check_property_id 
    AND created_by = auth.uid()
  );
$$;

-- 2. Ensure property_staff table exists
CREATE TABLE IF NOT EXISTS property_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, user_id)
);

-- 3. Reset RLS on property_staff
ALTER TABLE property_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assignments" ON property_staff;
CREATE POLICY "Users can view own assignments" ON property_staff
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff;
CREATE POLICY "Creators can manage property staff" ON property_staff
    FOR ALL USING (is_property_owner(property_id));

-- 4. Reset RLS on properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop all conflicting policies
DROP POLICY IF EXISTS "Users can view own property" ON properties;
DROP POLICY IF EXISTS "Users can view assigned properties" ON properties;
DROP POLICY IF EXISTS "Public can view properties" ON properties;
DROP POLICY IF EXISTS "Users can view own hotel" ON properties;
DROP POLICY IF EXISTS "Users can view own hotel or super_admin view all" ON properties;

-- Create a SINGLE, clear policy for Authenticated users
CREATE POLICY "Authenticated users can view assigned properties" ON properties
    FOR SELECT TO authenticated
    USING (
        -- 1. Created by user
        created_by = auth.uid()
        OR
        -- 2. Assigned via staff table
        id IN (SELECT property_id FROM property_staff WHERE user_id = auth.uid())
        OR
        -- 3. Super Admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Create policy for Public access (Anon only)
-- This ensures public pages work, but doesn't pollute the dashboard query for logged-in users
CREATE POLICY "Public can view properties" ON properties
    FOR SELECT TO anon
    USING (true);

-- 5. DATA REPAIR: Ensure the current user has access
-- Assign user to ALL properties they created
INSERT INTO property_staff (property_id, user_id, role)
SELECT id, auth.uid(), 'admin'
FROM properties
WHERE created_by = auth.uid()
ON CONFLICT DO NOTHING;

-- 6. Claim orphan properties (just in case)
UPDATE properties 
SET created_by = auth.uid() 
WHERE created_by IS NULL;

-- 7. Assign user to orphan properties
INSERT INTO property_staff (property_id, user_id, role)
SELECT id, auth.uid(), 'admin'
FROM properties
WHERE created_by = auth.uid()
ON CONFLICT DO NOTHING;
