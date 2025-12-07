-- SQL to Manually Create a Super Admin User
-- This script creates 'admin@zamora.com' with password 'admin123'
-- It bypasses the signup form and email verification entirely.

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    user_email TEXT := 'admin@zamora.com';
    user_password TEXT := 'admin123';
    -- Generate bcrypt hash (cost 10 is standard for Supabase/GoTrue)
    password_hash TEXT := crypt(user_password, gen_salt('bf', 10));
BEGIN
    -- 1. Check if user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RAISE NOTICE 'User % already exists. Updating permissions...', user_email;
        
        -- Update existing user to be verified
        -- REMOVED confirmed_at as it is a generated column
        UPDATE auth.users
        SET email_confirmed_at = NOW(),
            raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb
        WHERE email = user_email;
        
        -- Update profile to super_admin
        UPDATE public.profiles
        SET role = 'super_admin'
        WHERE id = (SELECT id FROM auth.users WHERE email = user_email);
        
    ELSE
        -- 2. Create new user
        -- REMOVED confirmed_at from INSERT
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            is_super_admin
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000', -- Default instance_id
            user_email,
            password_hash,
            NOW(), -- email_confirmed_at
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"first_name": "Admin", "last_name": "User"}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated',
            FALSE
        );

        -- 3. Ensure profile exists and has super_admin role
        INSERT INTO public.profiles (id, first_name, last_name, email, role)
        VALUES (new_user_id, 'Admin', 'User', user_email, 'super_admin')
        ON CONFLICT (id) DO UPDATE
        SET role = 'super_admin';
        
        RAISE NOTICE 'Created user % with password %', user_email, user_password;
    END IF;
END $$;
