-- Fix RLS policies for licenses table
-- This migration uses SECURITY DEFINER functions to avoid recursion and ensure admins can manage licenses

-- 1. Create a safe helper function for admin check
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

-- 2. Enable RLS (Ensure it's on)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Admins have full access to licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can view unused licenses to verify" ON public.licenses;
DROP POLICY IF EXISTS "Users can update license to mark as used" ON public.licenses;

-- 4. Create new SAFE policies using the helper function

-- Policy for Admins: Full access (Insert, Select, Update, Delete)
CREATE POLICY "Admins have full access to licenses"
ON public.licenses
FOR ALL
TO authenticated
USING (is_any_admin())
WITH CHECK (is_any_admin());

-- Policy for All Users: View unused licenses (needed for verification during activation)
CREATE POLICY "Users can view unused licenses"
ON public.licenses
FOR SELECT
TO authenticated
USING (status = 'unused');

-- Policy for All Users: Update license to mark as used (needed during activation)
-- This policy is restricted to ONLY changing status from unused to used
CREATE POLICY "Users can activate licenses"
ON public.licenses
FOR UPDATE
TO authenticated
USING (status = 'unused')
WITH CHECK (status = 'used');
