-- Allow users to view the property assigned to them in their profile
-- This ensures that staff members who are assigned a property (but didn't create it) can still see it.

CREATE POLICY "Users can view assigned property" ON properties
    FOR SELECT USING (
        id IN (
            SELECT property_id FROM profiles WHERE id = auth.uid()
        )
    );
