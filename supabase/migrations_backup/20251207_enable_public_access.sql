-- Enable public access for the storefront/booking pages
-- This allows guests (unauthenticated users) to view property details, rooms, and menus.

-- 1. Properties
-- Allow anyone to view properties (needed for the landing page)
DROP POLICY IF EXISTS "Public can view properties" ON properties;
CREATE POLICY "Public can view properties" ON properties
FOR SELECT TO anon, authenticated USING (true);

-- 2. Room Types
DROP POLICY IF EXISTS "Public can view room types" ON room_types;
CREATE POLICY "Public can view room types" ON room_types
FOR SELECT TO anon, authenticated USING (true);

-- 3. Menu Categories
DROP POLICY IF EXISTS "Public can view menu categories" ON menu_categories;
CREATE POLICY "Public can view menu categories" ON menu_categories
FOR SELECT TO anon, authenticated USING (true);

-- 4. Menu Items
DROP POLICY IF EXISTS "Public can view menu items" ON menu_items;
CREATE POLICY "Public can view menu items" ON menu_items
FOR SELECT TO anon, authenticated USING (true);
