
-- Migration to add delivery and gift options to orders

-- Food Orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_option TEXT, -- 'YANGO', 'BWANGU', 'PICKUP', etc.
ADD COLUMN IF NOT EXISTS order_category TEXT DEFAULT 'standard', -- 'delivery', 'in_house', etc.
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS recipient_address TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Bar Orders (keeping schema consistent)
ALTER TABLE bar_orders 
ADD COLUMN IF NOT EXISTS delivery_option TEXT,
ADD COLUMN IF NOT EXISTS order_category TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS recipient_address TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
