-- DEBUG: DISABLE RLS COMPLETELY
-- Use this ONLY to verify if RLS is the cause of the error.
-- If this fixes the "row-level security policy" error, then we know for sure it was RLS.

-- 1. Disable RLS on menu tables
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;

-- 2. Ensure property_id is nullable (Constraint check)
ALTER TABLE menu_items ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE menu_categories ALTER COLUMN property_id DROP NOT NULL;

-- 3. Ensure created_by exists
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
