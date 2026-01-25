
-- Grant permission for authenticated users (waiters/cashiers) to view room_types (table types)
-- This allows them to see table capacities and descriptions

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view room_types" ON room_types;
DROP POLICY IF EXISTS "Staff can view property room_types" ON room_types;

CREATE POLICY "Staff can view property room_types" ON room_types
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- User is a member of the property the room_type belongs to
    EXISTS (
      SELECT 1 FROM property_staff
      WHERE property_staff.property_id = room_types.property_id
      AND property_staff.user_id = auth.uid()
    )
    OR
    -- OR user is super admin
    is_super_admin()
  )
);
