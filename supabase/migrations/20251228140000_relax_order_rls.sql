-- Relax RLS for Orders and Bar Orders to allow Authenticated users to view them (matching Anon access)
-- This fixes the issue where Waiter App users (authenticated) cannot see orders because they might not be correctly linked as property members.

-- 1. ORDERS
DROP POLICY IF EXISTS "Staff can view property orders" ON orders;
CREATE POLICY "Staff can view property orders" ON orders
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. BAR ORDERS
DROP POLICY IF EXISTS "Staff can view property bar orders" ON bar_orders;
CREATE POLICY "Staff can view property bar orders" ON bar_orders
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. ORDER ITEMS
-- We ensure authenticated users can view items if they can view the order (which is now true for all)
DROP POLICY IF EXISTS "Staff can view order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can view order items" ON order_items;
DROP POLICY IF EXISTS "Users can view order items" ON order_items;

CREATE POLICY "Staff can view order items" ON order_items
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. BAR ORDER ITEMS
DROP POLICY IF EXISTS "Staff can view bar order items" ON bar_order_items;

CREATE POLICY "Staff can view bar order items" ON bar_order_items
    FOR SELECT
    TO authenticated
    USING (true);
