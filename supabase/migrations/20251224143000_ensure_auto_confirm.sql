-- Auto-confirm email fix
-- This script does two things:
-- 1. Sets up a trigger to automatically confirm ALL FUTURE signups.
-- 2. Updates ALL EXISTING users to be confirmed immediately.

-- 1. Create the helper function
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_email();

-- 3. IMPORTANT: Fix existing users (like luyando3@gmail.com)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
