-- Add waiter_name and table_number to orders and bar_orders tables

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS waiter_name TEXT,
ADD COLUMN IF NOT EXISTS table_number TEXT;

ALTER TABLE bar_orders 
ADD COLUMN IF NOT EXISTS waiter_name TEXT,
ADD COLUMN IF NOT EXISTS table_number TEXT;

-- Update RLS policies if necessary (usually existing policies cover all columns, but good to check)
-- Assuming existing policies are "FOR ALL USING (hotel_id = ...)" which covers new columns automatically.
