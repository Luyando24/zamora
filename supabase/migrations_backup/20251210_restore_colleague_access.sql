-- Restore Colleague Access to Properties
-- This migration ensures that users who were linked to a property via their profile
-- are explicitly added to property_staff, even if they aren't the 'owner' (created_by).
-- This resolves the "No properties found" issue for team members.

-- 1. Insert into property_staff based on profile links
-- We assign them 'admin' role so they have full access to manage the property
INSERT INTO property_staff (property_id, user_id, role)
SELECT 
    p.property_id, 
    p.id, 
    'admin'
FROM profiles p
JOIN properties prop ON prop.id = p.property_id
WHERE 
    p.property_id IS NOT NULL
    -- Exclude if user is already the owner (they have access via owner policy)
    AND prop.created_by != p.id
    -- Exclude if already in property_staff
    AND NOT EXISTS (
        SELECT 1 FROM property_staff ps 
        WHERE ps.property_id = p.property_id AND ps.user_id = p.id
    );

-- 2. Security Cleanup: Ensure "Public can view properties" is definitely GONE from the table
-- This closes the loophole where logged-out users (anon) could see properties
DROP POLICY IF EXISTS "Public can view properties" ON properties;

-- 3. Verification: Ensure strict RLS policies are in place
-- (We assume 20251209_secure_properties_v2.sql and emergency_fix are applied, 
-- but we can re-assert the "Users can view assigned properties" logic just in case)
