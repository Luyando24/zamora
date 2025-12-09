-- Add ingredients snapshot column to order_items and orders
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS item_ingredients TEXT;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS item_ingredients TEXT;
