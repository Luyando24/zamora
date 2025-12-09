-- Add snapshot fields to orders table to serve as order summary/preview
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS item_name TEXT, -- Will store summary like "2x Burger, 1x Fries"
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS item_image_url TEXT, -- Thumbnail (e.g. first item)
ADD COLUMN IF NOT EXISTS weight TEXT, -- Total weight or similar
ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb, -- Aggregated extras
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb, -- Aggregated options
ADD COLUMN IF NOT EXISTS category TEXT; -- Main category or mixed
