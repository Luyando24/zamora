-- Allow Super Admins to manage hotels
-- Drop restrictive policy
DROP POLICY IF EXISTS "Users can view own hotel" ON hotels;

-- 1. SELECT: Allow viewing own hotel OR if super_admin
CREATE POLICY "Users can view own hotel or super_admin view all" ON hotels
FOR SELECT USING (
  id = get_user_hotel_id() 
  OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 2. INSERT: Allow super_admin to insert
CREATE POLICY "Super admins can insert hotels" ON hotels
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 3. UPDATE: Allow super_admin to update
CREATE POLICY "Super admins can update hotels" ON hotels
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 4. DELETE: Allow super_admin to delete
CREATE POLICY "Super admins can delete hotels" ON hotels
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
