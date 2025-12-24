-- Migration to ensure deleting a property cascades to all related data
-- This script dynamically finds and updates foreign keys to use ON DELETE CASCADE

DO $$
DECLARE
    r RECORD;
    table_list TEXT[] := ARRAY[
        'property_staff',
        'rooms',
        'room_types',
        'guests',
        'bookings',
        'folios',
        'orders',
        'zra_transactions',
        'menu_categories',
        'menu_items',
        'bar_menu_categories',
        'bar_menu_items',
        'bar_orders',
        'bar_menu_item_properties',
        'maintenance_requests',
        'housekeeping_tasks'
    ];
    t TEXT;
    constraint_name TEXT;
    fk_column TEXT;
BEGIN
    FOREACH t IN ARRAY table_list
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            
            -- Find the foreign key constraint referencing properties (or hotels)
            -- We look for columns named 'property_id' or 'hotel_id'
            FOR r IN 
                SELECT tc.constraint_name, kcu.column_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON tc.constraint_name = rc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                  AND tc.table_name = t
                  AND (kcu.column_name = 'property_id' OR kcu.column_name = 'hotel_id')
            LOOP
                constraint_name := r.constraint_name;
                fk_column := r.column_name;

                -- Drop the existing constraint
                EXECUTE 'ALTER TABLE public.' || quote_ident(t) || ' DROP CONSTRAINT ' || quote_ident(constraint_name);
                
                -- Re-add with ON DELETE CASCADE
                -- We assume the target table is 'properties' (which is the new name for hotels)
                -- If the original constraint pointed to 'hotels', it still points to the same table (oid)
                EXECUTE 'ALTER TABLE public.' || quote_ident(t) || 
                        ' ADD CONSTRAINT ' || quote_ident(constraint_name) || 
                        ' FOREIGN KEY (' || quote_ident(fk_column) || ') ' ||
                        ' REFERENCES public.properties (id) ON DELETE CASCADE';
                
                RAISE NOTICE 'Updated constraint % on table % to CASCADE', constraint_name, t;
            END LOOP;
        END IF;
    END LOOP;

    -- Handle profiles separately (SET NULL instead of CASCADE)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
         FOR r IN 
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'profiles'
              AND (kcu.column_name = 'property_id' OR kcu.column_name = 'hotel_id')
        LOOP
            constraint_name := r.constraint_name;
            fk_column := r.column_name;

            EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_name);
            
            EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT ' || quote_ident(constraint_name) || 
                    ' FOREIGN KEY (' || quote_ident(fk_column) || ') ' ||
                    ' REFERENCES public.properties (id) ON DELETE SET NULL';
            
            RAISE NOTICE 'Updated constraint % on profiles to SET NULL', constraint_name;
        END LOOP;
    END IF;

    -- Ensure deep cascading for child tables that might not directly reference properties
    -- but depend on tables that do (e.g., folio_items -> folios)
    
    -- 1. Folio Items -> Folios
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'folio_items' AND table_schema = 'public') THEN
        FOR r IN 
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'folio_items'
              AND kcu.column_name = 'folio_id'
        LOOP
            constraint_name := r.constraint_name;
            EXECUTE 'ALTER TABLE public.folio_items DROP CONSTRAINT ' || quote_ident(constraint_name);
            EXECUTE 'ALTER TABLE public.folio_items ADD CONSTRAINT ' || quote_ident(constraint_name) || 
                    ' FOREIGN KEY (folio_id) REFERENCES public.folios (id) ON DELETE CASCADE';
            RAISE NOTICE 'Updated folio_items -> folios to CASCADE';
        END LOOP;
    END IF;

    -- 2. Order Items -> Orders (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
        FOR r IN 
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'order_items'
              AND kcu.column_name = 'order_id'
        LOOP
            constraint_name := r.constraint_name;
            EXECUTE 'ALTER TABLE public.order_items DROP CONSTRAINT ' || quote_ident(constraint_name);
            EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT ' || quote_ident(constraint_name) || 
                    ' FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE';
            RAISE NOTICE 'Updated order_items -> orders to CASCADE';
        END LOOP;
    END IF;
    
    -- 3. Rooms -> Room Types (Set Null is safer to avoid deleting room records if type is deleted independently, 
    -- but here we are deleting everything. CASCADE is fine for property wipe)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rooms' AND table_schema = 'public') THEN
        FOR r IN 
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'rooms'
              AND kcu.column_name = 'room_type_id'
        LOOP
            constraint_name := r.constraint_name;
            EXECUTE 'ALTER TABLE public.rooms DROP CONSTRAINT ' || quote_ident(constraint_name);
            EXECUTE 'ALTER TABLE public.rooms ADD CONSTRAINT ' || quote_ident(constraint_name) || 
                    ' FOREIGN KEY (room_type_id) REFERENCES public.room_types (id) ON DELETE CASCADE';
             RAISE NOTICE 'Updated rooms -> room_types to CASCADE';
        END LOOP;
    END IF;

END $$;
