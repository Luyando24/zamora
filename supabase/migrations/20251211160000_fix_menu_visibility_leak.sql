-- Fix Menu Visibility Leak
-- Restricts dashboard (authenticated) view while keeping public (anon) view open

-- 1. MENU ITEMS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view menu items" ON menu_items;

-- Anon (Guests) can see all (or we could restrict to "is_available = true")
CREATE POLICY "Public view menu items" ON menu_items
    FOR SELECT
    TO anon
    USING (true);

-- Staff (Authenticated) can ONLY see their own or assigned items
CREATE POLICY "Staff view menu items" ON menu_items
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        (property_id IS NOT NULL AND is_property_member(property_id, auth.uid()))
        OR
        EXISTS (
            SELECT 1 FROM menu_item_properties mip
            WHERE mip.menu_item_id = menu_items.id
            AND is_property_member(mip.property_id, auth.uid())
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 2. MENU CATEGORIES
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view menu categories" ON menu_categories;

CREATE POLICY "Public view menu categories" ON menu_categories
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Staff view menu categories" ON menu_categories
    FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        (property_id IS NOT NULL AND is_property_member(property_id, auth.uid()))
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 3. MENU ITEM PROPERTIES
ALTER TABLE menu_item_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view menu item properties" ON menu_item_properties;

CREATE POLICY "Public view menu item properties" ON menu_item_properties
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Staff view menu item properties" ON menu_item_properties
    FOR SELECT
    TO authenticated
    USING (
        is_property_member(property_id, auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
