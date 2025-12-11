-- Add new fields for Food Details UI
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS weight TEXT, -- e.g. "1.06 kg", "112 g"
ADD COLUMN IF NOT EXISTS ingredients TEXT, -- e.g. "Potatoes, oil, chicken"
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2), -- For strike-through price
ADD COLUMN IF NOT EXISTS discount_badge TEXT, -- e.g. "-12K"
ADD COLUMN IF NOT EXISTS dietary_info TEXT; -- e.g. "Fried", "Vegetarian", "Spicy"
