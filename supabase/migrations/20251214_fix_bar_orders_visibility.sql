-- Fix Bar Orders Visibility in Dashboard
-- Run this script in the Supabase SQL Editor if bar orders are still not appearing.

-- 1. Ensure RLS is enabled
ALTER TABLE bar_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_order_items ENABLE ROW LEVEL SECURITY;

-- 2. Grant access to Authenticated Users (Staff/Admins)
-- This policy allows any authenticated user who is a member of the property to view its bar orders.

DROP POLICY IF EXISTS "Staff can view property bar orders" ON bar_orders;
CREATE POLICY "Staff can view property bar orders" ON bar_orders
    FOR SELECT
    TO authenticated
    USING (
        is_property_member(property_id, auth.uid()) OR
        is_property_owner(property_id, auth.uid()) OR
        is_super_admin()
    );

DROP POLICY IF EXISTS "Staff can manage property bar orders" ON bar_orders;
CREATE POLICY "Staff can manage property bar orders" ON bar_orders
    FOR ALL
    TO authenticated
    USING (
        is_property_member(property_id, auth.uid()) OR
        is_property_owner(property_id, auth.uid()) OR
        is_super_admin()
    );

-- 3. Grant access to Bar Order Items
-- Users can see items if they can see the parent order.

DROP POLICY IF EXISTS "Staff can view bar order items" ON bar_order_items;
CREATE POLICY "Staff can view bar order items" ON bar_order_items
    FOR SELECT
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
