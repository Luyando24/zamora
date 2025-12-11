-- CONSOLIDATED FIX: Rename 'hotels' to 'properties' and fix all references
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Rename Table (Idempotent check)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hotels') THEN
    ALTER TABLE hotels RENAME TO properties;
  END IF;
END $$;

-- 2. Rename Columns in referencing tables (Idempotent check)
DO $$
BEGIN
  -- profiles
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hotel_id') THEN
    ALTER TABLE profiles RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- room_types
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'room_types' AND column_name = 'hotel_id') THEN
    ALTER TABLE room_types RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- rooms
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'hotel_id') THEN
    ALTER TABLE rooms RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- guests
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'hotel_id') THEN
    ALTER TABLE guests RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- bookings
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'hotel_id') THEN
    ALTER TABLE bookings RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- folios
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'folios' AND column_name = 'hotel_id') THEN
    ALTER TABLE folios RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- orders
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'hotel_id') THEN
    ALTER TABLE orders RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- zra_transactions
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'zra_transactions' AND column_name = 'hotel_id') THEN
    ALTER TABLE zra_transactions RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- menu_items
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'hotel_id') THEN
    ALTER TABLE menu_items RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- menu_categories
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'menu_categories' AND column_name = 'hotel_id') THEN
    ALTER TABLE menu_categories RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- housekeeping_logs
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'housekeeping_logs' AND column_name = 'hotel_id') THEN
    ALTER TABLE housekeeping_logs RENAME COLUMN hotel_id TO property_id;
  END IF;
  -- maintenance_requests
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'hotel_id') THEN
    ALTER TABLE maintenance_requests RENAME COLUMN hotel_id TO property_id;
  END IF;
END $$;

-- 3. Ensure 'created_by' column exists on properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 4. Recreate Helper Function (using new names)
CREATE OR REPLACE FUNCTION get_user_property_id()
RETURNS UUID AS $$
  SELECT property_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Wrapper for backward compatibility (optional, but good for safety)
CREATE OR REPLACE FUNCTION get_user_hotel_id()
RETURNS UUID AS $$
  SELECT get_user_property_id();
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Fix Admin User List Function (Critical for Admin Dashboard)
DROP FUNCTION IF EXISTS get_admin_users_list();

CREATE OR REPLACE FUNCTION get_admin_users_list()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  property_name TEXT, 
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email::VARCHAR(255),
    p.first_name,
    p.last_name,
    p.role,
    prop.name as property_name,
    p.status,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN properties prop ON p.property_id = prop.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Clean up and Recreate Policies
-- Properties
DROP POLICY IF EXISTS "Authenticated users can create hotels" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;

CREATE POLICY "Authenticated users can create properties" ON properties
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own hotel" ON properties;
DROP POLICY IF EXISTS "Users can view own property" ON properties;

CREATE POLICY "Users can view own property" ON properties
FOR SELECT USING (
  id = get_user_property_id() OR 
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Profiles
DROP POLICY IF EXISTS "Users can update own profile hotel_id" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile property_id" ON profiles; -- Added this line to fix the error
CREATE POLICY "Users can update own profile property_id" ON profiles
FOR UPDATE USING (id = auth.uid());

-- 7. Drop stale triggers that might reference 'hotels'
DROP TRIGGER IF EXISTS on_auth_user_created ON properties; 
-- (Triggers are usually on tables, if you had one on hotels it moved to properties)

-- 8. Verify 'property_id' usage in other tables' policies (Sample: Rooms)
-- We need to drop old policies that use 'hotel_id' column name if they weren't automatically updated by Postgres (Postgres usually handles column renames in simple policies, but not always in complex expressions).
-- It's safer to recreate them.

DROP POLICY IF EXISTS "Users can view hotel rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view property rooms" ON rooms;
CREATE POLICY "Users can view property rooms" ON rooms
    FOR ALL USING (property_id = get_user_property_id());

DROP POLICY IF EXISTS "Users can view hotel guests" ON guests;
DROP POLICY IF EXISTS "Users can view property guests" ON guests;
CREATE POLICY "Users can view property guests" ON guests
    FOR ALL USING (property_id = get_user_property_id());
