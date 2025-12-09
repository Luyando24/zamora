-- Fix relationships and RLS for order_items

-- 1. Ensure Foreign Key exists and is correct
DO $$ 
BEGIN 
    -- Drop existing constraint if it exists to ensure we have the correct one
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'order_items_order_id_fkey') THEN
        ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey;
    END IF;

    -- Re-add the constraint
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE;
END $$;

-- 2. Simplify and Fix RLS for order_items
-- We can simply check if the order_id exists in the visible orders
-- This inherits the RLS policy from the 'orders' table automatically

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view hotel order items" ON order_items;
DROP POLICY IF EXISTS "Users can view property order items" ON order_items;
DROP POLICY IF EXISTS "view_items_via_orders" ON order_items;

CREATE POLICY "view_items_via_orders" ON order_items
    FOR SELECT
    USING (
        order_id IN (SELECT id FROM orders)
    );

-- Ensure Insert is still allowed for public/guests
DROP POLICY IF EXISTS "Public can create order items" ON order_items;
CREATE POLICY "Public can create order items" ON order_items
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
