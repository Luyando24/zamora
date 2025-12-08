-- Create a junction table to link menu items to specific properties
CREATE TABLE IF NOT EXISTS menu_item_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_item_id, property_id)
);

-- Enable RLS
ALTER TABLE menu_item_properties ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view mappings for properties they own OR if they are viewing the public menu (anon)
CREATE POLICY "Public can view menu_item_properties"
    ON menu_item_properties FOR SELECT
    USING (true); -- Simplified for public access, can be tightened later

CREATE POLICY "Users can manage their own menu properties"
    ON menu_item_properties FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM menu_items
            WHERE menu_items.id = menu_item_properties.menu_item_id
            AND menu_items.created_by = auth.uid()
        )
    );

-- Migration: Auto-assign existing menu items to ALL properties owned by the same creator
-- This ensures we don't break the existing "all items on all properties" logic
INSERT INTO menu_item_properties (menu_item_id, property_id)
SELECT m.id, p.id
FROM menu_items m
JOIN properties p ON m.created_by = p.created_by
ON CONFLICT (menu_item_id, property_id) DO NOTHING;
