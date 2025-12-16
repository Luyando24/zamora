-- Update public_properties view to include slug
-- We append slug at the end to avoid column position conflicts during replacement
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
    slug
FROM properties;

GRANT SELECT ON public_properties TO anon, authenticated;
