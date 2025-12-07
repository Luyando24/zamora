-- Add customization options and gallery support to menu_items

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- customization_options structure example:
-- [
--   { "name": "Extra Cheese", "price": 10.00 },
--   { "name": "No Onion", "price": 0.00 }
-- ]
