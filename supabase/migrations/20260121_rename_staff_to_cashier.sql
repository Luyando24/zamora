-- Rename 'staff' role to 'cashier' and update defaults

-- 1. Update existing profiles
UPDATE profiles 
SET role = 'cashier' 
WHERE role = 'staff';

-- 2. Update the handle_new_user function to default to 'cashier'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'cashier') -- Default to cashier
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
