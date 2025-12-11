-- FORCE FIX MENU RLS AND DECOUPLING
-- Run this to resolve "row-level security policy" errors.

-- 1. Ensure columns exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Ensure property_id is nullable (CRITICAL for independent items)
ALTER TABLE menu_items ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE menu_categories ALTER COLUMN property_id DROP NOT NULL;

-- 3. Backfill created_by for existing items (so you don't lose access)
-- We map existing items to the property owner
UPDATE menu_items mi
SET created_by = p.created_by
FROM properties p
WHERE mi.property_id = p.id
AND (mi.created_by IS NULL OR mi.created_by = auth.uid()); -- Update if null or default

UPDATE menu_categories mc
SET created_by = p.created_by
FROM properties p
WHERE mc.property_id = p.id
AND (mc.created_by IS NULL OR mc.created_by = auth.uid());

-- 4. Clean up OLD policies that might be blocking inserts
DROP POLICY IF EXISTS "Users can view hotel menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can view property menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can manage own menu items" ON menu_items;
DROP POLICY IF EXISTS "Everyone can view menu items" ON menu_items;

DROP POLICY IF EXISTS "Users can view hotel menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can view property menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can manage own menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Everyone can view menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can manage hotel menu categories" ON menu_categories;

-- 5. Create NEW Policies (User-Centric)

-- Menu Items
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own menu items" ON menu_items
    FOR ALL
    USING (created_by = auth.uid());

CREATE POLICY "Everyone can view menu items" ON menu_items
    FOR SELECT
    USING (true);

-- Menu Categories
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own menu categories" ON menu_categories
    FOR ALL
    USING (created_by = auth.uid());

CREATE POLICY "Everyone can view menu categories" ON menu_categories
    FOR SELECT
    USING (true);
