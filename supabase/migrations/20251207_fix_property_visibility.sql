-- Fix User Permissions and Property Visibility
-- Run this script to ensure you can see and manage all properties

-- 1. Grant Super Admin role to the current user
-- This bypasses the single-property restriction
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = auth.uid();

-- 2. Claim orphan properties (optional, ensures you own existing properties)
UPDATE properties 
SET created_by = auth.uid() 
WHERE created_by IS NULL;

-- 3. Update Properties RLS to allow Super Admins to see ALL properties
DROP POLICY IF EXISTS "Users can view own property" ON properties;
CREATE POLICY "Users can view own property" ON properties
FOR SELECT USING (
  -- User is explicitly assigned to this property
  id IN (SELECT property_id FROM profiles WHERE id = auth.uid())
  OR 
  -- User created this property
  created_by = auth.uid() 
  OR
  -- User is a super_admin (can see everything)
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 4. Update Menu Items RLS to allow full access to visible properties
DROP POLICY IF EXISTS "Users can view property menu items" ON menu_items;
CREATE POLICY "Users can view property menu items" ON menu_items
FOR ALL USING (
  -- Allow access if the item belongs to a property the user can see
  property_id IN (
    SELECT id FROM properties
  )
);
