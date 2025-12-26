-- 1. Update public_properties view to include type
-- We drop the view first to avoid "cannot drop columns" or type mismatch errors
DROP VIEW IF EXISTS public_properties;

CREATE VIEW public_properties AS
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
    type
FROM properties;

GRANT SELECT ON public_properties TO anon, authenticated;

-- 2. Update search_properties function to return type
-- We drop the function first because we are changing the RETURN TABLE signature
DROP FUNCTION IF EXISTS search_properties;

CREATE FUNCTION search_properties(
  p_check_in DATE DEFAULT NULL,
  p_check_out DATE DEFAULT NULL,
  p_guests INT DEFAULT 1,
  p_search_query TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  cover_image_url TEXT,
  description TEXT,
  amenities TEXT[],
  slug TEXT,
  min_price NUMERIC,
  type TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH available_rooms AS (
    SELECT DISTINCT r.property_id, r.base_price
    FROM rooms r
    WHERE r.capacity >= p_guests
    AND r.status NOT IN ('maintenance')
    AND (
      p_check_in IS NULL OR p_check_out IS NULL OR NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.room_id = r.id
        AND b.status NOT IN ('cancelled', 'checked_out')
        AND b.check_in_date < p_check_out 
        AND b.check_out_date > p_check_in
      )
    )
  )
  SELECT 
    p.id,
    p.name,
    p.address,
    p.city,
    p.country,
    p.cover_image_url,
    p.description,
    p.amenities,
    p.slug,
    MIN(ar.base_price) as min_price,
    p.type
  FROM properties p
  JOIN available_rooms ar ON p.id = ar.property_id
  WHERE (
    p_search_query IS NULL OR p_search_query = '' OR
    p.name ILIKE '%' || p_search_query || '%' OR
    p.city ILIKE '%' || p_search_query || '%' OR
    p.country ILIKE '%' || p_search_query || '%'
  )
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;
