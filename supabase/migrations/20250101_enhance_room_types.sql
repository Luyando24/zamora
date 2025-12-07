-- Enhance room_types with images and amenities
ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
