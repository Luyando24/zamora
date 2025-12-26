-- Update public_properties view to include whatsapp_booking_phone
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
    whatsapp_booking_phone
FROM properties;

GRANT SELECT ON public_properties TO anon, authenticated;
