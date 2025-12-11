-- Fix Infinite Recursion between properties and property_staff policies

-- 1. Create a SECURITY DEFINER function to check property ownership
-- This bypasses RLS on the properties table to avoid the recursion loop:
-- properties policy -> queries property_staff -> property_staff policy -> queries properties (LOOP)
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

-- 2. Drop the recursive policy on property_staff
DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff;

-- 3. Re-create the policy using the safe function
CREATE POLICY "Creators can manage property staff" ON property_staff
    FOR ALL USING (
        is_property_owner(property_id)
    );
