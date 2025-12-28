-- Fix RLS policies to allow property creators to manage menu items
-- This addresses the issue where "new row violates row-level security policy" when adding food items

-- 1. menu_item_properties
DROP POLICY IF EXISTS "Users can manage menu item properties" ON menu_item_properties;

CREATE POLICY "Users can manage menu item properties" ON menu_item_properties
    FOR ALL
    USING (
        is_property_owner(property_id, auth.uid())
        OR
        EXISTS (SELECT 1 FROM properties WHERE id = property_id AND created_by = auth.uid())
        OR
        is_super_admin()
    );

-- 2. bar_menu_item_properties
DROP POLICY IF EXISTS "Users can manage bar menu item properties" ON bar_menu_item_properties;

CREATE POLICY "Users can manage bar menu item properties" ON bar_menu_item_properties
    FOR ALL
    USING (
        is_property_owner(property_id, auth.uid())
        OR
        EXISTS (SELECT 1 FROM properties WHERE id = property_id AND created_by = auth.uid())
        OR
        is_super_admin()
    );
