-- Ensure hotels table has all columns required by the new Property Setup flow
-- This migration is idempotent (safe to run multiple times)

ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'hotel',
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for faster amenity filtering if needed (optional but good for JSONB)
CREATE INDEX IF NOT EXISTS idx_hotels_amenities ON hotels USING gin (amenities);

-- Create index for hotel type
CREATE INDEX IF NOT EXISTS idx_hotels_type ON hotels (type);
