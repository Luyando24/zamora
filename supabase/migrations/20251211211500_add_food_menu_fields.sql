-- Add new fields to menu_items table for Food Menu improvements
-- Fields: weight (Portion Size), discount_badge, dietary_info, original_price

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS discount_badge TEXT,
ADD COLUMN IF NOT EXISTS dietary_info TEXT,
ADD COLUMN IF NOT EXISTS original_price NUMERIC;

-- Notify schema cache
COMMENT ON COLUMN menu_items.weight IS 'Portion Size or Weight';
COMMENT ON COLUMN menu_items.discount_badge IS 'Promotional Badge Text';
COMMENT ON COLUMN menu_items.dietary_info IS 'Dietary Tags (e.g. Vegetarian)';
COMMENT ON COLUMN menu_items.original_price IS 'Original Price for discounts';
