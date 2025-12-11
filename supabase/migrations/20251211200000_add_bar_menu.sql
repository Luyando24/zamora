
-- Create Bar Menu Tables

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

-- Enable RLS
ALTER TABLE bar_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_menu_item_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Bar Menu Items
CREATE POLICY "Everyone can view bar menu items" ON bar_menu_items FOR SELECT USING (true);
CREATE POLICY "Users can manage own bar menu items" ON bar_menu_items FOR ALL USING (
  created_by = auth.uid() OR
  (property_id IS NOT NULL AND is_property_owner(property_id, auth.uid())) OR
  is_super_admin()
);

-- Bar Menu Categories
CREATE POLICY "Everyone can view bar menu categories" ON bar_menu_categories FOR SELECT USING (true);
CREATE POLICY "Users can manage own bar menu categories" ON bar_menu_categories FOR ALL USING (
  created_by = auth.uid() OR
  (property_id IS NOT NULL AND is_property_owner(property_id, auth.uid())) OR
  is_super_admin()
);

-- Bar Menu Item Properties
CREATE POLICY "Everyone can view bar menu item properties" ON bar_menu_item_properties FOR SELECT USING (true);
CREATE POLICY "Users can manage bar menu item properties" ON bar_menu_item_properties FOR ALL USING (
  is_property_owner(property_id, auth.uid()) OR
  is_super_admin()
);

-- Bar Orders
CREATE POLICY "Public can create bar orders" ON bar_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Guests can view bar orders" ON bar_orders FOR SELECT TO anon USING (true);

CREATE POLICY "Staff can view property bar orders" ON bar_orders FOR SELECT TO authenticated USING (
  is_property_member(property_id, auth.uid()) OR
  is_property_owner(property_id, auth.uid()) OR
  is_super_admin()
);

CREATE POLICY "Staff can update property bar orders" ON bar_orders FOR UPDATE TO authenticated USING (
  is_property_member(property_id, auth.uid()) OR
  is_property_owner(property_id, auth.uid()) OR
  is_super_admin()
);

-- Bar Order Items
CREATE POLICY "Public can create bar order items" ON bar_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Guests can view bar order items" ON bar_order_items FOR SELECT TO anon USING (true);

CREATE POLICY "Staff can view bar order items" ON bar_order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM bar_orders WHERE bar_orders.id = bar_order_items.order_id AND (
    is_property_member(bar_orders.property_id, auth.uid()) OR
    is_property_owner(bar_orders.property_id, auth.uid()) OR
    is_super_admin()
  ))
);
