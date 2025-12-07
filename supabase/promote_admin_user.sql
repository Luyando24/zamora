-- Promote admin@zamora.com to super_admin and verify email
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Find the user ID from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'admin@zamora.com';

    IF target_user_id IS NOT NULL THEN
        -- 2. Confirm the email manually (skip verification)
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW(),
            last_sign_in_at = NOW(),
            raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
        WHERE id = target_user_id;

        -- 3. Update the profile role to super_admin
        UPDATE public.profiles
        SET role = 'super_admin'
        WHERE id = target_user_id;

        RAISE NOTICE 'User admin@zamora.com has been promoted to super_admin and verified.';
    ELSE
        RAISE NOTICE 'User admin@zamora.com not found. Please sign up first.';
    END IF;
END $$;
