-- Emergency Fix v3 for RLS Recursion
-- This migration uses a SECURITY DEFINER function to break the infinite loop definitively.

-- 1. Drop EVERYTHING related to the problematic policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view own property" ON properties;
DROP POLICY IF EXISTS "Users can view assigned properties" ON properties;
DROP POLICY IF EXISTS "Users can create own property" ON properties;
DROP POLICY IF EXISTS "Users can update own property" ON properties;
DROP POLICY IF EXISTS "Users can delete own property" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Public can view properties" ON properties;

DROP POLICY IF EXISTS "Staff visibility" ON property_staff;
DROP POLICY IF EXISTS "Staff management" ON property_staff;
DROP POLICY IF EXISTS "Property owners can manage staff" ON property_staff;
DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff;
DROP POLICY IF EXISTS "Users can view own assignments" ON property_staff;

DROP FUNCTION IF EXISTS is_property_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS is_property_owner(uuid) CASCADE;

-- 2. Create a SECURITY DEFINER function to check membership
-- This function runs as the database owner (bypassing RLS), so it can safely check property_staff
-- without triggering a recursive policy check on 'properties'.
CREATE OR REPLACE FUNCTION is_property_member(p_property_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_staff
    WHERE property_id = p_property_id
    AND user_id = p_user_id
  );
$$;

-- 3. Create a SECURITY DEFINER function to check ownership
-- Same concept: bypass RLS to check if someone is an owner (either via created_by or property_staff role)
CREATE OR REPLACE FUNCTION is_property_owner(p_property_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM properties WHERE id = p_property_id AND created_by = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM property_staff 
    WHERE property_id = p_property_id 
    AND user_id = p_user_id 
    AND role = 'owner'
  );
$$;

-- 4. Apply NEW, SIMPLE Policies using the functions

-- PROPERTIES TABLE
CREATE POLICY "Users can view assigned properties" ON properties
FOR SELECT USING (
  created_by = auth.uid()
  OR
  is_property_member(id, auth.uid()) -- Uses the secure function
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can create own property" ON properties
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own property" ON properties
FOR UPDATE USING (
  is_property_owner(id, auth.uid()) -- Uses the secure function
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can delete own property" ON properties
FOR DELETE USING (
  is_property_owner(id, auth.uid()) -- Uses the secure function
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- PROPERTY_STAFF TABLE
-- We can keep this one simple. Users can see their own rows.
-- Owners can see all rows for their properties.
CREATE POLICY "Staff visibility" ON property_staff
FOR SELECT USING (
  user_id = auth.uid()
  OR
  is_property_owner(property_id, auth.uid()) -- Uses the secure function
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Staff management" ON property_staff
FOR ALL USING (
  is_property_owner(property_id, auth.uid()) -- Uses the secure function
  OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
