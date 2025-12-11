-- NUKE AND FIX MENU RLS (FINAL ATTEMPT)
-- This script completely resets policies on menu_items and menu_categories
-- to resolve persistent "row-level security policy" errors.

-- 1. Drop ALL policies for menu_items dynamically to clear hidden conflicts
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'menu_items' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON menu_items', pol.policyname); 
    END LOOP; 
END $$;

-- 2. Drop ALL policies for menu_categories dynamically
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'menu_categories' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON menu_categories', pol.policyname); 
    END LOOP; 
END $$;

-- 3. Ensure columns exist and property_id is nullable
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE menu_items ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE menu_categories ALTER COLUMN property_id DROP NOT NULL;

-- 4. Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- 5. Create clean, explicit policies

-- Menu Items
CREATE POLICY "owner_manage_menu_items" ON menu_items
    FOR ALL
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "public_view_menu_items" ON menu_items
    FOR SELECT
    USING (true);

-- Menu Categories
CREATE POLICY "owner_manage_menu_categories" ON menu_categories
    FOR ALL
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "public_view_menu_categories" ON menu_categories
    FOR SELECT
    USING (true);

-- 6. Backfill ownership from properties (so you don't lose access to existing items)
UPDATE menu_items mi
SET created_by = p.created_by
FROM properties p
WHERE mi.property_id = p.id
AND (mi.created_by IS NULL);

UPDATE menu_categories mc
SET created_by = p.created_by
FROM properties p
WHERE mc.property_id = p.id
AND (mc.created_by IS NULL);
