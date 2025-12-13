-- Fix RLS policies for bar_orders and bar_order_items to allow public inserts
-- This is required for guests (anonymous users) to place orders

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE bar_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_order_items ENABLE ROW LEVEL SECURITY;

-- 2. Bar Orders Policies

-- Allow anyone (guests/anon and staff/authenticated) to CREATE orders
DROP POLICY IF EXISTS "Public can create bar orders" ON bar_orders;
CREATE POLICY "Public can create bar orders" ON bar_orders
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow guests (anon) to VIEW orders (needed if they need to fetch status later)
-- We rely on UUID obscurity or local storage tracking
DROP POLICY IF EXISTS "Guests can view bar orders" ON bar_orders;
CREATE POLICY "Guests can view bar orders" ON bar_orders
    FOR SELECT
    TO public
    USING (true);

-- Allow staff (authenticated) to VIEW/UPDATE orders for their property
-- Note: We use a separate policy for staff to ensure they can see ALL orders for their property
DROP POLICY IF EXISTS "Staff can manage property bar orders" ON bar_orders;
CREATE POLICY "Staff can manage property bar orders" ON bar_orders
    FOR ALL
    TO authenticated
    USING (
        is_property_member(property_id, auth.uid()) OR
        is_property_owner(property_id, auth.uid()) OR
        is_super_admin()
    );

-- 3. Bar Order Items Policies

-- Allow anyone to CREATE order items
DROP POLICY IF EXISTS "Public can create bar order items" ON bar_order_items;
CREATE POLICY "Public can create bar order items" ON bar_order_items
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow guests to VIEW order items
DROP POLICY IF EXISTS "Guests can view bar order items" ON bar_order_items;
CREATE POLICY "Guests can view bar order items" ON bar_order_items
    FOR SELECT
    TO public
    USING (true);

-- Allow staff to VIEW/MANAGE order items
-- Logic: If they can see the parent order, they can see the items
DROP POLICY IF EXISTS "Staff can manage bar order items" ON bar_order_items;
CREATE POLICY "Staff can manage bar order items" ON bar_order_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bar_orders 
            WHERE bar_orders.id = bar_order_items.order_id 
            AND (
                is_property_member(bar_orders.property_id, auth.uid()) OR
                is_property_owner(bar_orders.property_id, auth.uid()) OR
                is_super_admin()
            )
        )
    );
