-- Fix RLS for order_items to ensure they are visible to property owners and staff
-- This matches the logic applied to the 'orders' table in 20251209_fix_orders_rls.sql

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view hotel order items" ON order_items;
DROP POLICY IF EXISTS "Users can view property order items" ON order_items;

CREATE POLICY "Users can view property order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                -- User is the owner of the property
                orders.property_id IN (
                    SELECT id FROM properties WHERE created_by = auth.uid()
                )
                OR
                -- User is assigned to the property (Employee)
                orders.property_id = (SELECT property_id FROM profiles WHERE id = auth.uid())
                OR 
                -- User is a super admin
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
            )
        )
    );
