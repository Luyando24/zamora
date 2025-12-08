-- Add missing fields to orders table for guest checkout
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT,
ADD COLUMN IF NOT EXISTS guest_room_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Allow public (guests) to create orders
DROP POLICY IF EXISTS "Public can create orders" ON orders;
CREATE POLICY "Public can create orders" ON orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow public (guests) to create order items
DROP POLICY IF EXISTS "Public can create order items" ON order_items;
CREATE POLICY "Public can create order items" ON order_items
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
