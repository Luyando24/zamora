-- Update RLS for menu_items to allow viewing items from ALL properties the user has access to
-- (e.g. properties they created OR properties they are assigned to)

DROP POLICY IF EXISTS "Users can view hotel menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can view property menu items" ON menu_items;

CREATE POLICY "Users can view property menu items" ON menu_items
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties
        )
    );
