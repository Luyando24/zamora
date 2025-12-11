-- Fix Property Access by backfilling relationships
-- This addresses the issue where users cannot see their properties after enabling strict RLS
-- because the 'created_by' column or 'profiles.property_id' link was missing.

-- 1. Backfill properties.created_by
-- Assign ownership of a property to the first user found in profiles who is linked to it.
-- Only for properties that don't have an owner yet.
UPDATE properties
SET created_by = (
    SELECT id 
    FROM profiles 
    WHERE profiles.property_id = properties.id 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE created_by IS NULL;

-- 2. Backfill profiles.property_id
-- If a user created a property but their profile doesn't point to it, link them.
-- Only if profile isn't already linked to a property.
UPDATE profiles
SET property_id = (
    SELECT id 
    FROM properties 
    WHERE properties.created_by = profiles.id 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE property_id IS NULL;

-- 3. Ensure property_staff table is populated (if used)
-- Insert an entry for the owner if not exists
INSERT INTO property_staff (property_id, user_id, role)
SELECT id, created_by, 'owner'
FROM properties
WHERE created_by IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM property_staff 
    WHERE property_id = properties.id 
    AND user_id = properties.created_by
);
