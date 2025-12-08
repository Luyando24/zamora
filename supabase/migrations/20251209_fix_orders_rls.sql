-- Fix RLS for orders to allow property owners to view orders for their properties
-- regardless of their current profile assignment

DROP POLICY IF EXISTS "Users can view property orders" ON orders;

CREATE POLICY "Users can view property orders" ON orders
    FOR ALL USING (
        -- User is the owner of the property
        property_id IN (
            SELECT id FROM properties WHERE created_by = auth.uid()
        )
        OR
        -- User is assigned to the property (Employee)
        property_id = (SELECT property_id FROM profiles WHERE id = auth.uid())
        OR 
        -- User is a super admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
