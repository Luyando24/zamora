-- Secure Menu Items and Orders
-- Relies on is_property_member and is_property_owner functions from previous migration

-- 1. MENU ITEMS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_menu_items" ON menu_items;
DROP POLICY IF EXISTS "owner_manage_menu_items" ON menu_items;
DROP POLICY IF EXISTS "public_view_menu_items" ON menu_items;
DROP POLICY IF EXISTS "Users can view hotel menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can view property menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can manage own menu items" ON menu_items;
DROP POLICY IF EXISTS "Everyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;

-- Public/Everyone can view (for digital menu)
DROP POLICY IF EXISTS "Everyone can view menu items" ON menu_items;
CREATE POLICY "Everyone can view menu items" ON menu_items
    FOR SELECT
    USING (true);

-- Only creators or property owners can manage
DROP POLICY IF EXISTS "Users can manage own menu items" ON menu_items;
CREATE POLICY "Users can manage own menu items" ON menu_items
    FOR ALL
    USING (
        created_by = auth.uid()
        OR
        (property_id IS NOT NULL AND is_property_owner(property_id, auth.uid()))
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 2. ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Guests can view orders" ON orders;
DROP POLICY IF EXISTS "Staff can manage property orders" ON orders;
DROP POLICY IF EXISTS "Users can view property orders" ON orders;
DROP POLICY IF EXISTS "Users can view hotel orders" ON orders;
DROP POLICY IF EXISTS "Staff can view property orders" ON orders;
DROP POLICY IF EXISTS "Staff can update property orders" ON orders;

-- Guests can create
CREATE POLICY "Public can create orders" ON orders
    FOR INSERT
    WITH CHECK (true);

-- Guests can view (limited by UUID usually, but permissive for anon for now to avoid breaking guest checkout)
CREATE POLICY "Guests can view orders" ON orders
    FOR SELECT
    TO anon
    USING (true);

-- Staff can ONLY view orders for their assigned properties
CREATE POLICY "Staff can view property orders" ON orders
    FOR SELECT
    TO authenticated
    USING (
        is_property_member(property_id, auth.uid())
        OR
        is_property_owner(property_id, auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Staff can UPDATE orders (e.g. status) for their properties
CREATE POLICY "Staff can update property orders" ON orders
    FOR UPDATE
    TO authenticated
    USING (
        is_property_member(property_id, auth.uid())
        OR
        is_property_owner(property_id, auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 3. MENU CATEGORIES (Same logic as items)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "owner_manage_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "public_view_menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can view hotel menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can view property menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can manage own menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Everyone can view menu categories" ON menu_categories;

CREATE POLICY "Everyone can view menu categories" ON menu_categories
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own menu categories" ON menu_categories
    FOR ALL
    USING (
        created_by = auth.uid()
        OR
        (property_id IS NOT NULL AND is_property_owner(property_id, auth.uid()))
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 4. MENU ITEM PROPERTIES (Junction table)
ALTER TABLE menu_item_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view menu_item_properties" ON menu_item_properties;
DROP POLICY IF EXISTS "Users can manage their own menu properties" ON menu_item_properties;
DROP POLICY IF EXISTS "Everyone can view menu item properties" ON menu_item_properties;
DROP POLICY IF EXISTS "Users can manage menu item properties" ON menu_item_properties;

CREATE POLICY "Everyone can view menu item properties" ON menu_item_properties
    FOR SELECT USING (true);

CREATE POLICY "Users can manage menu item properties" ON menu_item_properties
    FOR ALL
    USING (
        is_property_owner(property_id, auth.uid())
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
