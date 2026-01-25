-- ============================================
-- STOCK MANAGEMENT ENHANCEMENT MIGRATION
-- Adds: menu_item_recipes, stock_snapshots
-- ============================================

-- 1. Menu Item Recipes: Links menu items to their ingredient stock items
CREATE TABLE IF NOT EXISTS menu_item_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    bar_menu_item_id UUID REFERENCES bar_menu_items(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
    quantity_per_unit NUMERIC NOT NULL DEFAULT 1, -- e.g., 0.5 kg of rice per dish
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Either menu_item_id or bar_menu_item_id, not both
    CONSTRAINT recipe_item_constraint CHECK (
        (menu_item_id IS NOT NULL AND bar_menu_item_id IS NULL) OR
        (menu_item_id IS NULL AND bar_menu_item_id IS NOT NULL)
    )
);

-- 2. Stock Snapshots: Logs inventory state at beginning of day/week/month
CREATE TABLE IF NOT EXISTS stock_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
    snapshot_date DATE NOT NULL,
    items JSONB NOT NULL, -- Array of {item_id, name, quantity, unit, cost_per_unit}
    total_value NUMERIC DEFAULT 0, -- Sum of (quantity * cost_per_unit) for all items
    notes TEXT, -- Optional notes like "Opening stock for Monday"
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Only one snapshot of each type per day per property
    UNIQUE(property_id, snapshot_type, snapshot_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_recipes_menu_item ON menu_item_recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_bar_menu_item ON menu_item_recipes(bar_menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_inventory_item ON menu_item_recipes(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_property ON menu_item_recipes(property_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_property ON stock_snapshots(property_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON stock_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON stock_snapshots(snapshot_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE menu_item_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_snapshots ENABLE ROW LEVEL SECURITY;

-- Recipes: Viewable by property members
CREATE POLICY "Recipes viewable by property members"
  ON menu_item_recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.property_id = menu_item_recipes.property_id
    )
  );

-- Recipes: Editable by managers/owners/admins
CREATE POLICY "Recipes editable by managers"
  ON menu_item_recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.property_id = menu_item_recipes.property_id
      AND profiles.role IN ('admin', 'manager', 'owner')
    )
  );

-- Snapshots: Viewable by property members
CREATE POLICY "Snapshots viewable by property members"
  ON stock_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.property_id = stock_snapshots.property_id
    )
  );

-- Snapshots: Editable by managers/owners/admins
CREATE POLICY "Snapshots editable by managers"
  ON stock_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.property_id = stock_snapshots.property_id
      AND profiles.role IN ('admin', 'manager', 'owner')
    )
  );

-- ============================================
-- REALTIME SUBSCRIPTIONS (Optional)
-- ============================================

-- Enable realtime for inventory updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
-- ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;
