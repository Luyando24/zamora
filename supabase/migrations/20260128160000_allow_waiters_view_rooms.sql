
-- Grant permission for authenticated users (waiters) to view rooms (tables)
-- This allows them to select tables when creating orders

-- First, ensure RLS is enabled on rooms table (it likely is, but good to be sure)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists to replace it or ensure we don't duplicate logic
-- (Assuming standard naming convention, adjust if you have specific existing policies)
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON rooms;

-- Create a policy that allows any authenticated user who is a member of the property to view its rooms
CREATE POLICY "Staff can view property rooms" ON rooms
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- User is a member of the property the room belongs to
    EXISTS (
      SELECT 1 FROM property_staff
      WHERE property_staff.property_id = rooms.property_id
      AND property_staff.user_id = auth.uid()
    )
    OR
    -- OR user is super admin
    is_super_admin()
  )
);
