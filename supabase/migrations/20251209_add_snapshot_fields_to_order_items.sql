-- Add snapshot fields to order_items to preserve item details at time of order
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS item_image_url TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update RLS to allow public/authenticated to insert these new columns
-- (Existing policies usually cover all columns for INSERT, but good to be aware)
