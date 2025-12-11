-- Add new fields to bar_menu_items table
-- Fields: weight (Volume/Size), discount_badge, dietary_info, original_price

ALTER TABLE bar_menu_items 
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS discount_badge TEXT,
ADD COLUMN IF NOT EXISTS dietary_info TEXT,
ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Notify schema cache
COMMENT ON COLUMN bar_menu_items.weight IS 'Volume or Size (e.g. 330ml)';
COMMENT ON COLUMN bar_menu_items.discount_badge IS 'Promotional Badge Text';
COMMENT ON COLUMN bar_menu_items.dietary_info IS 'Alcohol Info or Tags';
COMMENT ON COLUMN bar_menu_items.original_price IS 'Original Price for discounts';
