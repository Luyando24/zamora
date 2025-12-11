-- FINAL FIX: Global Data Migration
-- This script fixes the issue where previous scripts relied on 'auth.uid()' which is empty in the SQL Editor.
-- It globally migrates ALL assignments for ALL users.

-- 1. Backfill property_staff from properties.created_by (The Creator)
-- This ensures every property creator is an admin of their property
INSERT INTO property_staff (property_id, user_id, role)
SELECT id, created_by, 'admin'
FROM properties
WHERE created_by IS NOT NULL
ON CONFLICT (property_id, user_id) DO NOTHING;

-- 2. Backfill property_staff from profiles.property_id (The Old Assignment Method)
-- This ensures users assigned via the old method are migrated
INSERT INTO property_staff (property_id, user_id, role)
SELECT property_id, id, 'admin'
FROM profiles
WHERE property_id IS NOT NULL
ON CONFLICT (property_id, user_id) DO NOTHING;

-- 3. Ensure RLS on property_staff allows reading your own rows
DROP POLICY IF EXISTS "Users can view own assignments" ON property_staff;
CREATE POLICY "Users can view own assignments" ON property_staff
    FOR SELECT USING (user_id = auth.uid());

-- 4. Verify properties RLS is correct (re-apply to be safe)
DROP POLICY IF EXISTS "Authenticated users can view assigned properties" ON properties;
CREATE POLICY "Authenticated users can view assigned properties" ON properties
    FOR SELECT TO authenticated
    USING (
        -- User created it
        created_by = auth.uid()
        OR
        -- User is in the staff list
        id IN (SELECT property_id FROM property_staff WHERE user_id = auth.uid())
        OR
        -- Super Admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
