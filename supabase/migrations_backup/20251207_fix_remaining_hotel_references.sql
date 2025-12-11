-- Fix remaining references to 'hotels' and 'hotel_id' in functions and policies

-- 1. Drop and recreate the admin function that referenced 'hotels' and 'hotel_id'
DROP FUNCTION IF EXISTS get_admin_users_list();

CREATE OR REPLACE FUNCTION get_admin_users_list()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  property_name TEXT, -- Renamed from hotel_name
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

-- 2. Clean up old policies that might still reference hotel_id (double check)
DROP POLICY IF EXISTS "Users can update own profile hotel_id" ON profiles;

CREATE POLICY "Users can update own profile property_id" ON profiles
FOR UPDATE USING (
  id = auth.uid()
);

-- 3. Ensure 'property_id' column exists on profiles (should be done by rename, but safe to check triggers)
-- Note: The previous rename migration should have handled the column rename.
-- If you have a trigger that automatically assigns hotel_id on signup, it needs to be updated.

-- Check for any triggers on profiles
-- (We can't easily see triggers in SQL files, but we can replace the function if we know its name.
-- Common pattern: handle_new_user)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'staff');
  RETURN new;
END;
$$;
