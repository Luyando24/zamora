-- Fix Infinite Recursion: V6 (Super Final)
-- The recursion persisted because policies on 'properties' were querying 'profiles' (for super_admin check),
-- and 'profiles' likely has a policy that queries 'properties' (to show colleagues), creating a loop:
-- properties -> profiles -> properties.

-- Strategy:
-- 1. Create a SECURITY DEFINER function `is_super_admin()` to check roles without triggering 'profiles' RLS.
-- 2. Use this function in ALL policies instead of direct `profiles` table subqueries.
-- 3. Ensure `is_property_owner` and `is_property_member` are also SECURITY DEFINER and recursion-free.

-- ==============================================================================
-- 1. Safe Helper Functions (SECURITY DEFINER to bypass RLS)
-- ==============================================================================

-- Check if user is super_admin (Bypasses profiles RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- Check if user is owner of a property (Bypasses property_staff RLS)
-- ONLY queries property_staff, never properties
CREATE OR REPLACE FUNCTION public.is_property_owner(p_property_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM property_staff 
    WHERE property_id = p_property_id 
    AND user_id = p_user_id 
    AND role = 'owner'
  );
$$;

-- Check if user is member of a property (Bypasses property_staff RLS)
CREATE OR REPLACE FUNCTION public.is_property_member(p_property_id UUID, p_user_id UUID)
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

-- ==============================================================================
-- 2. Clean Up Old Policies (Aggressive Drop)
-- ==============================================================================

-- Properties
DROP POLICY IF EXISTS "Users can view assigned properties" ON properties;
DROP POLICY IF EXISTS "Users can update own property" ON properties;
DROP POLICY IF EXISTS "Users can delete own property" ON properties;
DROP POLICY IF EXISTS "Users can create own property" ON properties;
DROP POLICY IF EXISTS "Users can view own property" ON properties; -- Potential old name
DROP POLICY IF EXISTS "Authenticated users can view assigned properties" ON properties; -- Potential old name

-- Property Staff
DROP POLICY IF EXISTS "Staff visibility" ON property_staff;
DROP POLICY IF EXISTS "Staff management" ON property_staff;
DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff; -- Potential old name

-- ==============================================================================
-- 3. Apply New SAFE Policies (Using Helper Functions)
-- ==============================================================================

-- PROPERTIES
-- Select: Created by user OR Member OR Super Admin
CREATE POLICY "Users can view assigned properties" ON properties
FOR SELECT USING (
  created_by = auth.uid()
  OR
  is_property_member(id, auth.uid())
  OR
  is_super_admin() -- Safe function call
);

-- Update: Owner OR Super Admin
CREATE POLICY "Users can update own property" ON properties
FOR UPDATE USING (
  created_by = auth.uid()
  OR
  is_property_owner(id, auth.uid())
  OR
  is_super_admin() -- Safe function call
);

-- Delete: Owner OR Super Admin
CREATE POLICY "Users can delete own property" ON properties
FOR DELETE USING (
  created_by = auth.uid()
  OR
  is_property_owner(id, auth.uid())
  OR
  is_super_admin() -- Safe function call
);

-- Insert: Authenticated
CREATE POLICY "Users can create own property" ON properties
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- PROPERTY STAFF
-- Select: Self OR Owner OR Super Admin
CREATE POLICY "Staff visibility" ON property_staff
FOR SELECT USING (
  user_id = auth.uid()
  OR
  is_property_owner(property_id, auth.uid())
  OR
  is_super_admin()
);

-- Manage: Owner OR Super Admin
CREATE POLICY "Staff management" ON property_staff
FOR ALL USING (
  is_property_owner(property_id, auth.uid())
  OR
  is_super_admin()
);

-- ==============================================================================
-- 4. Refresh Dependent Policies (Optional but Safe)
-- ==============================================================================

-- Menu Items
DROP POLICY IF EXISTS "Users can view property menu items" ON menu_items;
CREATE POLICY "Users can view property menu items" ON menu_items
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties
        )
    );

-- Orders
DROP POLICY IF EXISTS "Users can view property orders" ON orders;
CREATE POLICY "Users can view property orders" ON orders
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties
        )
    );

-- Profiles (Just in case, ensure it doesn't break)
-- We don't touch profiles policy here to avoid complexity, but properties policy no longer depends on it directly.
