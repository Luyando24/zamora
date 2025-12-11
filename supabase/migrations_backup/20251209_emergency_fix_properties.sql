-- EMERGENCY FIX: Restore Property Access
-- This script fixes potential broken states from previous failed migrations
-- and provides a safety net for orphaned properties.

-- 1. Ensure columns exist (Idempotent)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. RESET Policies on Properties
-- We drop everything to be sure we aren't in a "Deny All" state due to a missing policy
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view properties" ON properties;
DROP POLICY IF EXISTS "Users can view own property" ON properties;
DROP POLICY IF EXISTS "View Orphans" ON properties;
DROP POLICY IF EXISTS "Authenticated can view orphans" ON properties;
DROP POLICY IF EXISTS "Super admins can insert properties" ON properties;
DROP POLICY IF EXISTS "Super admins can update properties" ON properties;
DROP POLICY IF EXISTS "Super admins can delete properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Owners can update own property" ON properties;

-- 3. Re-create the STRICT Policy (Standard Access)
CREATE POLICY "Users can view own property" ON properties
    FOR SELECT USING (
        -- User is the owner
        created_by = auth.uid()
        OR
        -- User is explicitly assigned staff
        EXISTS (SELECT 1 FROM property_staff WHERE property_id = properties.id AND user_id = auth.uid())
        OR
        -- User is assigned via profile (Legacy)
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND property_id = properties.id)
        OR
        -- User is super admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 4. EMERGENCY POLICY: View Orphans
-- Allow authenticated users to see properties that have NO owner.
-- This brings back the "disappeared" properties.
CREATE POLICY "Authenticated can view orphans" ON properties
    FOR ALL
    TO authenticated
    USING (created_by IS NULL)
    WITH CHECK (created_by IS NULL OR created_by = auth.uid()); 
    -- Allow updating orphan to claim it (setting created_by to self)

-- 5. Restore Standard CRUD policies
CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Owners can update own property" ON properties
    FOR UPDATE
    USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM property_staff WHERE property_id = properties.id AND user_id = auth.uid() AND role IN ('owner', 'manager')));

-- 6. Ensure Public View exists and is correct (for the booking site)
CREATE OR REPLACE VIEW public_properties AS
SELECT 
    id,
    name,
    address,
    phone,
    email,
    website_url,
    facebook_url,
    instagram_url,
    twitter_url,
    logo_url,
    cover_image_url,
    gallery_urls,
    description,
    amenities,
    created_at
FROM properties;

GRANT SELECT ON public_properties TO anon, authenticated;
