-- Add stock management columns to bar_menu_items table
ALTER TABLE bar_menu_items
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0.00;

-- Optional: Create an index if queries filter by low stock frequently
CREATE INDEX IF NOT EXISTS idx_bar_menu_items_stock 
ON bar_menu_items(property_id) 
WHERE track_stock = TRUE AND stock_quantity <= low_stock_threshold;
