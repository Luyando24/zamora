-- Create a shared sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Add order_number to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number BIGINT DEFAULT nextval('order_number_seq');

-- Add order_number to bar_orders
ALTER TABLE bar_orders 
ADD COLUMN IF NOT EXISTS order_number BIGINT DEFAULT nextval('order_number_seq');

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_bar_orders_order_number ON bar_orders(order_number);
