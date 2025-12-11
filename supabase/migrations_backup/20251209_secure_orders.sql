-- Secure Orders Table
-- Fixes the issue where authenticated users (staff) could see orders from other properties
-- by separating the policies for Anonymous (Guests) and Authenticated (Staff) users.

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view property orders" ON orders;
DROP POLICY IF EXISTS "Users can view hotel orders" ON orders;
DROP POLICY IF EXISTS "Public can view orders" ON orders; -- In case it exists

-- 3. Policy: Public (Guests & Staff) can CREATE orders
CREATE POLICY "Public can create orders" ON orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 4. Policy: Guests (Anon) can VIEW orders (needed for Order History)
-- Relying on UUID obscurity for now. Explicitly restricted to 'anon' role
-- so it doesn't leak into the dashboard (which uses 'authenticated' role).
CREATE POLICY "Guests can view orders" ON orders
    FOR SELECT
    TO anon
    USING (true);

-- 5. Policy: Staff (Authenticated) can VIEW/UPDATE orders ONLY for their property
CREATE POLICY "Staff can manage property orders" ON orders
    FOR ALL
    TO authenticated
    USING (
        -- User created the property
        property_id IN (
            SELECT id FROM properties WHERE created_by = auth.uid()
        )
        OR
        -- User is explicitly assigned to this property (via property_staff)
        EXISTS (SELECT 1 FROM property_staff WHERE property_id = orders.property_id AND user_id = auth.uid())
        OR
        -- User is assigned via profiles (legacy)
        property_id = (SELECT property_id FROM profiles WHERE id = auth.uid())
        OR
        -- User is super admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );
