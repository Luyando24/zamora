
-- Add table_id column to orders and bar_orders to link directly to rooms table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES rooms(id);

ALTER TABLE bar_orders 
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES rooms(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_bar_orders_table_id ON bar_orders(table_id);
