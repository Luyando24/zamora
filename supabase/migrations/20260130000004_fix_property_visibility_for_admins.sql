-- Update properties RLS to allow all admins and super admins to view properties
-- This is necessary for the license management dashboard to show property names

-- 1. Use the is_any_admin() function if it exists, or create it if it doesn't
CREATE OR REPLACE FUNCTION public.is_any_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  );
$$;

-- 2. Update the SELECT policy for properties
DROP POLICY IF EXISTS "Users can view assigned properties" ON properties;

CREATE POLICY "Users can view assigned properties" ON properties
FOR SELECT USING (
  created_by = auth.uid()
  OR
  is_property_member(id, auth.uid())
  OR
  is_any_admin() -- Allow both super_admin and admin
);
