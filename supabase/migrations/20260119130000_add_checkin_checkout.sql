ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time TEXT;

DROP VIEW IF EXISTS public_properties;

CREATE VIEW public_properties AS
SELECT 
    id,
    name,
    address,
    city,
    country,
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
    type,
    check_in_time,
    check_out_time
FROM properties;

GRANT SELECT ON public_properties TO anon, authenticated;
