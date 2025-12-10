-- Secure Properties Table and Create Public View

-- 0. Add missing columns expected by frontend
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;

-- 1. Drop the permissive public policy on properties table
DROP POLICY IF EXISTS "Public can view properties" ON properties;

-- 2. Ensure strict RLS on properties table (Only owners/staff can view full details)
-- We need to make sure we don't lock out the dashboard users
DROP POLICY IF EXISTS "Users can view own property" ON properties;
CREATE POLICY "Users can view own property" ON properties
    FOR SELECT USING (
        -- User created the property
        created_by = auth.uid()
        OR
        -- User is explicitly assigned to this property (via property_staff)
        EXISTS (SELECT 1 FROM property_staff WHERE property_id = properties.id AND user_id = auth.uid())
        OR
        -- User is assigned via profiles (legacy/simple mode)
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND property_id = properties.id)
        OR
        -- User is super admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 3. Create a View for Public Access (Safe Columns only)
CREATE OR REPLACE VIEW public_properties AS
SELECT 
    id,
    name,
    address,
    -- city, country (if they exist, otherwise null) - assuming they might be part of address or missing columns
    -- selecting specific columns to avoid leaking zra_tpin etc.
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
    -- base_price, -- calculated by frontend or fetched from room_types
    created_at
FROM properties;

-- 4. Grant access to the view
GRANT SELECT ON public_properties TO anon, authenticated;
