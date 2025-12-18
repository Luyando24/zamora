
-- Hidden Bar Menu Categories (for soft deletion of global defaults)
CREATE TABLE IF NOT EXISTS hidden_bar_menu_categories (
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID REFERENCES bar_menu_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (property_id, category_id)
);

-- Hidden Menu Categories (for soft deletion of global defaults)
CREATE TABLE IF NOT EXISTS hidden_menu_categories (
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (property_id, category_id)
);

-- Enable RLS
ALTER TABLE hidden_bar_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_menu_categories ENABLE ROW LEVEL SECURITY;

-- Policies for hidden_bar_menu_categories
DROP POLICY IF EXISTS "Staff can view hidden bar categories" ON hidden_bar_menu_categories;
CREATE POLICY "Staff can view hidden bar categories" ON hidden_bar_menu_categories
  FOR SELECT
  USING (
    is_property_member(property_id, auth.uid()) OR
    is_property_owner(property_id, auth.uid()) OR
    is_super_admin()
  );

DROP POLICY IF EXISTS "Staff can manage hidden bar categories" ON hidden_bar_menu_categories;
CREATE POLICY "Staff can manage hidden bar categories" ON hidden_bar_menu_categories
  FOR ALL
  USING (
    is_property_member(property_id, auth.uid()) OR
    is_property_owner(property_id, auth.uid()) OR
    is_super_admin()
  );

-- Policies for hidden_menu_categories
DROP POLICY IF EXISTS "Staff can view hidden menu categories" ON hidden_menu_categories;
CREATE POLICY "Staff can view hidden menu categories" ON hidden_menu_categories
  FOR SELECT
  USING (
    is_property_member(property_id, auth.uid()) OR
    is_property_owner(property_id, auth.uid()) OR
    is_super_admin()
  );

DROP POLICY IF EXISTS "Staff can manage hidden menu categories" ON hidden_menu_categories;
CREATE POLICY "Staff can manage hidden menu categories" ON hidden_menu_categories
  FOR ALL
  USING (
    is_property_member(property_id, auth.uid()) OR
    is_property_owner(property_id, auth.uid()) OR
    is_super_admin()
  );
