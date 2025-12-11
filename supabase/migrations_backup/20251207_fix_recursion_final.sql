-- FIX: Infinite Recursion in RLS Policies
-- This script replaces direct table access in RLS policies with SECURITY DEFINER functions
-- to prevent infinite recursion loops between properties, property_staff, and profiles.

-- Enable uuid-ossp extension if not exists (required for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Ensure property_staff table exists
CREATE TABLE IF NOT EXISTS property_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, user_id)
);

-- 1. Create helper to get assigned property IDs without triggering RLS
-- This function runs as the creator (superuser) and bypasses RLS on property_staff
CREATE OR REPLACE FUNCTION get_my_assigned_property_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT property_id FROM property_staff WHERE user_id = auth.uid();
$$;

-- 2. Create helper to check super admin status without triggering RLS
-- This function runs as the creator (superuser) and bypasses RLS on profiles
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;

-- 3. Update Properties RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop all existing SELECT policies to be clean
DROP POLICY IF EXISTS "Authenticated users can view assigned properties" ON properties;
DROP POLICY IF EXISTS "Users can view own property" ON properties;
DROP POLICY IF EXISTS "Users can view assigned property" ON properties;

-- Create the new safe policy
CREATE POLICY "Authenticated users can view assigned properties" ON properties
    FOR SELECT TO authenticated
    USING (
        -- User created it (Direct column check, safe)
        created_by = auth.uid()
        OR
        -- User is in the staff list (Using recursion-safe function)
        id IN (SELECT get_my_assigned_property_ids())
        OR
        -- Super Admin (Using recursion-safe function)
        is_super_admin()
    );

-- 4. Ensure property_staff RLS is also safe
ALTER TABLE property_staff ENABLE ROW LEVEL SECURITY;

-- Ensure we have the basic view policy
DROP POLICY IF EXISTS "Users can view own assignments" ON property_staff;
CREATE POLICY "Users can view own assignments" ON property_staff
    FOR SELECT USING (user_id = auth.uid());

-- Ensure management policy exists
-- We ensure is_property_owner is defined safely
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

DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff;
CREATE POLICY "Creators can manage property staff" ON property_staff
    FOR ALL USING (is_property_owner(property_id));

-- 5. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_my_assigned_property_ids TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_property_owner TO authenticated;
