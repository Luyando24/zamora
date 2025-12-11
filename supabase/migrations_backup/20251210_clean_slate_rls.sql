-- Clean slate migration to fix RLS recursion and visibility issues
-- This migration resets policies for properties and property_staff tables

-- 1. Drop existing policies to clear the board
DROP POLICY IF EXISTS "Users can view own property" ON properties;
DROP POLICY IF EXISTS "Users can create own property" ON properties;
DROP POLICY IF EXISTS "Users can update own property" ON properties;
DROP POLICY IF EXISTS "Users can delete own property" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;

DROP POLICY IF EXISTS "Property owners can manage staff" ON property_staff;
DROP POLICY IF EXISTS "Staff can view their property assignment" ON property_staff;
DROP POLICY IF EXISTS "Users can view their own staff assignments" ON property_staff;
DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff;

-- 2. Drop dependent functions (if any)
-- Use CASCADE to ensure dependent policies are dropped automatically
DROP FUNCTION IF EXISTS is_property_owner(uuid) CASCADE;

-- 3. Create helper function with SECURITY DEFINER to break recursion
-- This function runs with elevated privileges to check ownership without triggering RLS on properties table recursively
CREATE OR REPLACE FUNCTION is_property_owner(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM properties 
    WHERE id = p_id 
    AND created_by = auth.uid()
  );
$$;

-- 4. Create new policies for PROPERTIES table

-- SELECT: Users can see properties if they own them, are staff, or are super_admin
CREATE POLICY "Users can view own property" ON properties
FOR SELECT USING (
  created_by = auth.uid() -- Owner
  OR
  EXISTS ( -- Staff member
    SELECT 1 FROM property_staff 
    WHERE property_id = properties.id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS ( -- Super Admin
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- INSERT: Authenticated users can create properties
CREATE POLICY "Users can create own property" ON properties
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- UPDATE: Owners and Super Admins can update
CREATE POLICY "Users can update own property" ON properties
FOR UPDATE USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- DELETE: Owners and Super Admins can delete
CREATE POLICY "Users can delete own property" ON properties
FOR DELETE USING (
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- 5. Create new policies for PROPERTY_STAFF table

-- SELECT: Users can see their own assignments, and Owners/Super Admins can see all staff for their properties
CREATE POLICY "Staff visibility" ON property_staff
FOR SELECT USING (
  user_id = auth.uid() -- I can see my own assignment
  OR
  is_property_owner(property_id) -- Property owner can see staff
  OR
  EXISTS ( -- Super Admin can see all
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- INSERT/UPDATE/DELETE: Only Property Owners and Super Admins can manage staff
CREATE POLICY "Staff management" ON property_staff
FOR ALL USING (
  is_property_owner(property_id)
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);
