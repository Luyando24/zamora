-- Update handle_new_user to respect the role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'staff') -- Use metadata role or default to staff
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
