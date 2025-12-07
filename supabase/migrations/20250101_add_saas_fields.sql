-- Add SaaS management fields to hotels table
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial', -- 'trial', 'basic', 'pro', 'enterprise'
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS zra_tpin TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create users table extension for app-specific profile data if not exists
-- (Assuming auth.users is managed by Supabase, we usually have a public.profiles or similar)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  hotel_id UUID REFERENCES hotels(id),
  role TEXT DEFAULT 'staff', -- 'admin', 'manager', 'staff', 'super_admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
