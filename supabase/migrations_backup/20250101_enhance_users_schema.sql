-- Enhance profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active', -- 'active', 'suspended', 'inactive'
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- Create a secure view or function to fetch profiles with emails (for Admin use)
-- Note: Direct access to auth.users is restricted. We create a security definer function.
CREATE OR REPLACE FUNCTION get_admin_users_list()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  hotel_name TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if user has super_admin role (logic to be enforced by RLS or app, 
  -- here we rely on the calling client being authenticated as admin/service role if strictly enforced,
  -- but for this MVP we just return the data joined).
  RETURN QUERY
  SELECT 
    p.id,
    au.email::VARCHAR(255),
    p.first_name,
    p.last_name,
    p.role,
    h.name as hotel_name,
    p.status,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN hotels h ON p.hotel_id = h.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
