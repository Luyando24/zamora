-- 1. Create a dedicated table for property assignments
-- This allows a single user to be assigned to multiple properties without being a super_admin
CREATE TABLE IF NOT EXISTS property_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'staff', -- 'admin', 'staff', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, user_id)
);

-- Enable RLS
ALTER TABLE property_staff ENABLE ROW LEVEL SECURITY;

-- 2. Migrate existing assignments from the 'profiles' table
-- This ensures no existing access is lost
INSERT INTO property_staff (property_id, user_id, role)
SELECT property_id, id, 'admin'
FROM profiles
WHERE property_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Define Policies for property_staff
-- Users can see which properties they are assigned to
DROP POLICY IF EXISTS "Users can view own assignments" ON property_staff;
CREATE POLICY "Users can view own assignments" ON property_staff
    FOR SELECT USING (user_id = auth.uid());

-- Property creators can manage staff for their properties
DROP POLICY IF EXISTS "Creators can manage property staff" ON property_staff;
CREATE POLICY "Creators can manage property staff" ON property_staff
    FOR ALL USING (
        EXISTS (SELECT 1 FROM properties WHERE id = property_staff.property_id AND created_by = auth.uid())
    );

-- 4. Update Properties RLS to use the new table
-- This is the key change: Users see properties they Created OR are Assigned to
DROP POLICY IF EXISTS "Users can view own property" ON properties;
DROP POLICY IF EXISTS "Users can view assigned properties" ON properties;

CREATE POLICY "Users can view assigned properties" ON properties
    FOR SELECT USING (
        -- User created the property
        created_by = auth.uid()
        OR
        -- User is assigned to the property via property_staff
        id IN (SELECT property_id FROM property_staff WHERE user_id = auth.uid())
        OR
        -- User is a super_admin (fallback for system admins)
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 5. Helper: If you are not a super admin, you can revert your role
-- UNCOMMENT the line below if you want to revert your user to normal 'staff' or 'admin' status
-- UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
