-- Fix profiles RLS to ensure users can always view their own profile
-- This is critical for fetching property_id
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Ensure public/anon can read basics of profiles if needed? 
-- No, for security we keep profiles private, but 'colleagues' policy handles the rest.
