-- SQL Script to Convert a User to Super Admin
-- Usage: Replace 'target_user@example.com' with the email of the user you want to promote.

DO $$
DECLARE
    target_email TEXT := 'target_user@example.com'; -- <<< REPLACE THIS EMAIL
    target_user_id UUID;
BEGIN
    -- 1. Find the user ID from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- 2. Update the profile role to super_admin
        -- We use an UPSERT approach to ensure a profile exists
        INSERT INTO public.profiles (id, email, role, first_name, last_name)
        VALUES (
            target_user_id, 
            target_email, 
            'super_admin', 
            'Super', 
            'Admin'
        )
        ON CONFLICT (id) DO UPDATE
        SET role = 'super_admin';

        -- 3. (Optional) Auto-confirm the user's email if not already confirmed
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            confirmed_at = COALESCE(confirmed_at, NOW())
        WHERE id = target_user_id;

        RAISE NOTICE 'User % has been successfully promoted to super_admin.', target_email;
    ELSE
        RAISE NOTICE 'User % not found in auth.users. Please sign up the user first.', target_email;
    END IF;
END $$;
