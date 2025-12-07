-- FIX FOR SIGNUP ERROR
-- The 'profiles' table was created with 'full_name' but the trigger expects 'first_name' and 'last_name'.
-- This script fixes the table structure and re-creates the trigger function.

-- 1. Fix Profiles Table Structure
ALTER TABLE profiles 
DROP COLUMN IF EXISTS full_name;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Re-create the Trigger Function to be safe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
