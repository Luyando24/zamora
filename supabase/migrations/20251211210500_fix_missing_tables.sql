-- Create Bar Menu Tables (Combined Fix)
-- This migration ensures all bar menu related tables are created.
-- It uses IF NOT EXISTS to prevent errors if some tables already exist.

-- 1. Bar Menu Categories
CREATE TABLE IF NOT EXISTS bar_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  property_id UUID REFERENCES properties(id)
);

-- 2. Bar Menu Items
CREATE TABLE IF NOT EXISTS bar_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  property_id UUID REFERENCES properties(id),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Bar Menu Item Properties (Junction)
CREATE TABLE IF NOT EXISTS bar_menu_item_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES bar_menu_items(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bar Orders
CREATE TABLE IF NOT EXISTS bar_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  guest_room_number TEXT,
  guest_name TEXT,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  guest_phone TEXT,
  payment_method TEXT,
  property_id UUID REFERENCES properties(id)
);

-- 5. Bar Order Items
CREATE TABLE IF NOT EXISTS bar_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES bar_orders(id) ON DELETE CASCADE,
  bar_menu_item_id UUID REFERENCES bar_menu_items(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  unit_price NUMERIC,
  total_price NUMERIC,
  -- Snapshot fields
  item_name TEXT,
  item_description TEXT,
  item_ingredients TEXT,
  item_image_url TEXT,
  weight TEXT,
  extras JSONB,
  options JSONB
);

-- Enable RLS (Safe to run multiple times)
ALTER TABLE bar_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_menu_item_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Drop and recreate to avoid errors)
DROP POLICY IF EXISTS "Everyone can view bar menu items" ON bar_menu_items;
CREATE POLICY "Everyone can view bar menu items" ON bar_menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own bar menu items" ON bar_menu_items;
CREATE POLICY "Users can manage own bar menu items" ON bar_menu_items FOR ALL USING (
  created_by = auth.uid() OR
  (property_id IS NOT NULL AND is_property_owner(property_id, auth.uid())) OR
  is_super_admin()
);

DROP POLICY IF EXISTS "Everyone can view bar menu categories" ON bar_menu_categories;
CREATE POLICY "Everyone can view bar menu categories" ON bar_menu_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own bar menu categories" ON bar_menu_categories;
CREATE POLICY "Users can manage own bar menu categories" ON bar_menu_categories FOR ALL USING (
  created_by = auth.uid() OR
  (property_id IS NOT NULL AND is_property_owner(property_id, auth.uid())) OR
  is_super_admin()
);

DROP POLICY IF EXISTS "Everyone can view bar menu item properties" ON bar_menu_item_properties;
CREATE POLICY "Everyone can view bar menu item properties" ON bar_menu_item_properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage bar menu item properties" ON bar_menu_item_properties;
CREATE POLICY "Users can manage bar menu item properties" ON bar_menu_item_properties FOR ALL USING (
  is_property_owner(property_id, auth.uid()) OR
  is_super_admin()
);

-- Notify schema cache
COMMENT ON TABLE bar_menu_items IS 'Bar Menu Items Table';
