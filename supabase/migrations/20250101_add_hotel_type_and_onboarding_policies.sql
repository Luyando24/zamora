-- Add property type to hotels
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'hotel'; -- hotel, lodge, guest_house, apartment

-- Allow any authenticated user to create a hotel (if they don't have one? handled by logic, but policy must allow)
-- We need to ensure that when they create it, they can see it to bind it.

-- Let's enable INSERT for authenticated users
CREATE POLICY "Authenticated users can create hotels" ON hotels
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Allow users to update their own profile to set the hotel_id
CREATE POLICY "Users can update own profile hotel_id" ON profiles
FOR UPDATE USING (
  id = auth.uid()
);
