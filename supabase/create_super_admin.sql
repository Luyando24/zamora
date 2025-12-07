-- SQL to Create a Super Admin User
-- 1. Sign up a new user manually in the Supabase Authentication dashboard first.
--    Email: admin@zamora.com (or your preferred email)
--    Password: (your secure password)

-- 2. Once the user is created, get their UUID from the Authentication tab.

-- 3. Run the following SQL, replacing 'USER_UUID_HERE' with the actual UUID.
--    This will elevate their privileges to 'super_admin'.

UPDATE profiles
SET role = 'super_admin'
WHERE id = 'USER_UUID_HERE';

-- Verification:
SELECT * FROM profiles WHERE role = 'super_admin';
