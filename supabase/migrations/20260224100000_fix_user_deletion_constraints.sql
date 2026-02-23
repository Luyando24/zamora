-- Fix user deletion constraints to allow cascading delete or set null
-- This prevents "Database error deleting user" when a user has created records in these tables.

-- ==============================================================================
-- 1. CRITICAL: Fix profiles table (The main blocker)
-- ==============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop the constraint on profiles.id referencing auth.users
    FOR r IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'profiles'
          AND kcu.column_name = 'id'
    LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Re-add with ON DELETE CASCADE
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- ==============================================================================
-- 2. Fix tables referencing auth.users directly (SET NULL)
-- ==============================================================================

-- bookings.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'created_by') THEN
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_created_by_fkey;
        ALTER TABLE bookings ADD CONSTRAINT bookings_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- properties.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'created_by') THEN
        ALTER TABLE properties DROP CONSTRAINT IF EXISTS hotels_created_by_fkey;
        ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_created_by_fkey;
        ALTER TABLE properties ADD CONSTRAINT properties_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- analytics_events.user_id
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'user_id') THEN
        ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;
        ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- orders.user_id
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
        ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- bar_orders.user_id
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bar_orders' AND column_name = 'user_id') THEN
        ALTER TABLE bar_orders DROP CONSTRAINT IF EXISTS bar_orders_user_id_fkey;
        ALTER TABLE bar_orders ADD CONSTRAINT bar_orders_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- stock_snapshots.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_snapshots' AND column_name = 'created_by') THEN
        ALTER TABLE stock_snapshots DROP CONSTRAINT IF EXISTS stock_snapshots_created_by_fkey;
        ALTER TABLE stock_snapshots ADD CONSTRAINT stock_snapshots_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- inventory_transactions.performed_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_transactions' AND column_name = 'performed_by') THEN
        ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_performed_by_fkey;
        ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_performed_by_fkey
            FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- bar_menu_categories.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bar_menu_categories' AND column_name = 'created_by') THEN
        ALTER TABLE bar_menu_categories DROP CONSTRAINT IF EXISTS bar_menu_categories_created_by_fkey;
        ALTER TABLE bar_menu_categories ADD CONSTRAINT bar_menu_categories_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- bar_menu_items.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bar_menu_items' AND column_name = 'created_by') THEN
        ALTER TABLE bar_menu_items DROP CONSTRAINT IF EXISTS bar_menu_items_created_by_fkey;
        ALTER TABLE bar_menu_items ADD CONSTRAINT bar_menu_items_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- places.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'created_by') THEN
        ALTER TABLE places DROP CONSTRAINT IF EXISTS places_created_by_fkey;
        ALTER TABLE places ADD CONSTRAINT places_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- activities.created_by
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'created_by') THEN
        ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_created_by_fkey;
        ALTER TABLE activities ADD CONSTRAINT activities_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================================================
-- 3. Fix tables referencing profiles (SET NULL)
-- ==============================================================================

-- licenses.created_by (references profiles)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'created_by') THEN
        ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_created_by_fkey;
        ALTER TABLE licenses ADD CONSTRAINT licenses_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- housekeeping_logs.cleaned_by (references profiles)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'housekeeping_logs' AND column_name = 'cleaned_by') THEN
        ALTER TABLE housekeeping_logs DROP CONSTRAINT IF EXISTS housekeeping_logs_cleaned_by_fkey;
        ALTER TABLE housekeeping_logs ADD CONSTRAINT housekeeping_logs_cleaned_by_fkey
            FOREIGN KEY (cleaned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- maintenance_requests.reported_by (references profiles)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'reported_by') THEN
        ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_reported_by_fkey;
        ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_reported_by_fkey
            FOREIGN KEY (reported_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;
