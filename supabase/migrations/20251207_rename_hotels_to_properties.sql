-- 1. Ensure created_by column exists (from previous fix)
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Rename table hotels to properties
ALTER TABLE hotels RENAME TO properties;

-- 3. Rename hotel_id to property_id in all referencing tables
ALTER TABLE profiles RENAME COLUMN hotel_id TO property_id;
ALTER TABLE room_types RENAME COLUMN hotel_id TO property_id;
ALTER TABLE rooms RENAME COLUMN hotel_id TO property_id;
ALTER TABLE guests RENAME COLUMN hotel_id TO property_id;
ALTER TABLE bookings RENAME COLUMN hotel_id TO property_id;
ALTER TABLE folios RENAME COLUMN hotel_id TO property_id;
ALTER TABLE orders RENAME COLUMN hotel_id TO property_id;
ALTER TABLE zra_transactions RENAME COLUMN hotel_id TO property_id;
ALTER TABLE menu_categories RENAME COLUMN hotel_id TO property_id;
ALTER TABLE menu_items RENAME COLUMN hotel_id TO property_id;
ALTER TABLE housekeeping_logs RENAME COLUMN hotel_id TO property_id;
ALTER TABLE maintenance_requests RENAME COLUMN hotel_id TO property_id;

-- 4. Create new helper function
CREATE OR REPLACE FUNCTION get_user_property_id()
RETURNS UUID AS $$
  SELECT property_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Drop old function (will fail if used by policies, so we must drop policies first)
-- We'll just define the new one and let the old one rot for a moment, or replace it to call the new one.
CREATE OR REPLACE FUNCTION get_user_hotel_id()
RETURNS UUID AS $$
  SELECT get_user_property_id();
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Recreate Policies for 'properties' (formerly hotels)
-- Drop old policies that might use the old function or old table name (Postgres handles table name change but policy name stays)
DROP POLICY IF EXISTS "Users can view own hotel" ON properties;
DROP POLICY IF EXISTS "Users can view own hotel or super_admin view all" ON properties;
DROP POLICY IF EXISTS "Super admins can insert hotels" ON properties;
DROP POLICY IF EXISTS "Super admins can update hotels" ON properties;
DROP POLICY IF EXISTS "Super admins can delete hotels" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create hotels" ON properties;
DROP POLICY IF EXISTS "Users can view hotels they created" ON properties;

-- Create new policies
CREATE POLICY "Users can view own property" ON properties
    FOR SELECT USING (id = get_user_property_id() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin') OR created_by = auth.uid());

CREATE POLICY "Super admins can insert properties" ON properties
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Super admins can update properties" ON properties
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Super admins can delete properties" ON properties
    FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Update Policies for other tables to use get_user_property_id()
-- Example for rooms
DROP POLICY IF EXISTS "Users can view hotel rooms" ON rooms;
CREATE POLICY "Users can view property rooms" ON rooms
    FOR ALL USING (property_id = get_user_property_id());

-- Example for bookings
DROP POLICY IF EXISTS "Users can view hotel bookings" ON bookings;
CREATE POLICY "Users can view property bookings" ON bookings
    FOR ALL USING (property_id = get_user_property_id());

-- Example for guests
DROP POLICY IF EXISTS "Users can view hotel guests" ON guests;
CREATE POLICY "Users can view property guests" ON guests
    FOR ALL USING (property_id = get_user_property_id());

-- Example for orders
DROP POLICY IF EXISTS "Users can view hotel orders" ON orders;
CREATE POLICY "Users can view property orders" ON orders
    FOR ALL USING (property_id = get_user_property_id());

-- Example for profiles
DROP POLICY IF EXISTS "Users can view colleagues" ON profiles;
CREATE POLICY "Users can view colleagues" ON profiles
    FOR SELECT USING (property_id = get_user_property_id());
