-- Add Child Policy fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS allows_children BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 0;

-- Update public_properties view to include child policy fields
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
    created_at,
    slug,
    whatsapp_booking_phone,
    allows_children,
    max_children
FROM properties;

GRANT SELECT ON public_properties TO anon, authenticated;
