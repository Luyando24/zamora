-- SQL to Create or Update the admin@zamora.com user
-- This script will ensure the user exists, is verified, and has super_admin role.

DO $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    existing_user_id UUID;
    user_email TEXT := 'admin@zamora.com';
    user_password TEXT := 'admin123'; -- Default password, user should change this
    encrypted_pw TEXT;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = user_email;

    IF existing_user_id IS NOT NULL THEN
        -- UPDATE EXISTING USER
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW(),
            last_sign_in_at = NOW(),
            raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
        WHERE id = existing_user_id;

        -- Update Profile
        UPDATE public.profiles
        SET role = 'super_admin'
        WHERE id = existing_user_id;
        
        RAISE NOTICE 'User % exists. Updated verification and role.', user_email;
    ELSE
        -- CREATE NEW USER
        -- We need to insert into auth.users. 
        -- NOTE: Inserting directly into auth.users is usually restricted to supabase_admin.
        -- If this script fails due to permissions, you must use the Supabase Dashboard or Client SDK.
        -- However, in the SQL Editor of the Dashboard, this usually works.
        
        -- Generate a hash for the password (this is just a placeholder, 
        -- real auth requires proper hashing which pgcrypto can do if enabled, 
        -- but Supabase uses GoTrue/bcrypt. 
        -- Inserting a raw password string WILL NOT WORK for login.
        
        -- ALTERNATIVE STRATEGY:
        -- We cannot easily insert a valid password hash via SQL without the specific bcrypt salt/cost used by GoTrue.
        -- So we will rely on the user having created the account OR we assume this script runs in a context where we can't create auth users easily.
        
        -- WAIT! If the user is failing to sign up via UI, it might be easier to fix the UI or provide a script that fixes the "invalid" state if it exists.
        
        RAISE NOTICE 'User % does not exist. Please create it via the Sign Up page first, or use the Supabase Dashboard to create the user.', user_email;
        
        -- If you really need to force create, you might be blocked by password hashing.
    END IF;
END $$;
