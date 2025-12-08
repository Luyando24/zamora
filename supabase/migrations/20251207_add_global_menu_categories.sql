-- 1. Make property_id nullable in menu_categories to support global categories
ALTER TABLE menu_categories ALTER COLUMN property_id DROP NOT NULL;

-- 2. Drop the unique constraint that includes property_id (if it strictly requires property_id)
-- The existing unique constraint is UNIQUE(hotel_id, name) which is now property_id, name.
-- Unique constraints with NULL values behave differently (NULL != NULL), so we might want to keep it or adjust it.
-- For now, we'll leave it, as we can have multiple global categories with same name if we are not careful, but we will be careful.

-- 3. Insert popular global categories
INSERT INTO menu_categories (property_id, name)
VALUES 
  (NULL, 'Appetizers'),
  (NULL, 'Main Course'),
  (NULL, 'Desserts'),
  (NULL, 'Beverages'),
  (NULL, 'Breakfast'),
  (NULL, 'Lunch'),
  (NULL, 'Dinner'),
  (NULL, 'Snacks'),
  (NULL, 'Kids Menu'),
  (NULL, 'Specials')
ON CONFLICT DO NOTHING;

-- 4. Update RLS policies to allow viewing global categories

-- Drop existing select policy if strictly scoped
DROP POLICY IF EXISTS "Public can view menu categories" ON menu_categories;

-- Create a new policy that allows viewing if property_id matches OR is NULL
-- Actually, the previous public policy was: FOR SELECT TO anon, authenticated USING (true);
-- USING (true) ALREADY allows viewing everything, including NULL property_id.
-- So we just need to make sure the "Users can manage hotel menu categories" policy for admins doesn't prevent them from SEEING global ones,
-- but usually "manage" implies INSERT/UPDATE/DELETE.
-- Let's check the admin policy.
-- "Users can manage hotel menu categories" FOR ALL USING (hotel_id = get_user_hotel_id());
-- This restricts SELECTs for admins too if they use the dashboard.

DROP POLICY IF EXISTS "Users can manage hotel menu categories" ON menu_categories;

-- Split into view vs modify
CREATE POLICY "Users can view menu categories" ON menu_categories
    FOR SELECT TO authenticated
    USING (property_id = get_user_property_id() OR property_id IS NULL);

CREATE POLICY "Users can manage property menu categories" ON menu_categories
    FOR ALL TO authenticated
    USING (property_id = get_user_property_id())
    WITH CHECK (property_id = get_user_property_id());

-- Re-create the public policy just to be sure it's consistent
CREATE POLICY "Public can view menu categories" ON menu_categories
    FOR SELECT TO anon
    USING (true);
