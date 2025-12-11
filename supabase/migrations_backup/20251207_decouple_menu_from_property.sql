-- DECOUPLE MENU FROM PROPERTY
-- This makes menu items independent of specific properties, owned by the User instead.

-- 1. Add created_by column to menu_items and categories if not exists
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Backfill created_by from the property owner (best effort)
-- We find the owner of the property currently assigned to the item
UPDATE menu_items mi
SET created_by = p.created_by
FROM properties p
WHERE mi.property_id = p.id; 

-- Backfill categories (only property-specific ones will match the join)
UPDATE menu_categories mc
SET created_by = p.created_by
FROM properties p
WHERE mc.property_id = p.id;

-- 3. Make property_id nullable (Independent!)
ALTER TABLE menu_items ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE menu_categories ALTER COLUMN property_id DROP NOT NULL;

-- 4. Update RLS Policies
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view hotel menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can view property menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can manage own menu items" ON menu_items;
DROP POLICY IF EXISTS "Everyone can view menu items" ON menu_items;

-- Allow creators to do everything
CREATE POLICY "Users can manage own menu items" ON menu_items
    FOR ALL
    USING (created_by = auth.uid());

-- Allow everyone to view (Public Menu)
CREATE POLICY "Everyone can view menu items" ON menu_items
    FOR SELECT
    USING (true);

-- Categories Policies
DROP POLICY IF EXISTS "Users can view hotel menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can view property menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Users can manage own menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Everyone can view menu categories" ON menu_categories;

CREATE POLICY "Users can manage own menu categories" ON menu_categories
    FOR ALL
    USING (created_by = auth.uid());

CREATE POLICY "Everyone can view menu categories" ON menu_categories
    FOR SELECT
    USING (true);
