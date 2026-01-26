-- Migration to update rooms_status_check constraint to allow 'available' and 'occupied'
-- This is necessary after the change from clean/dirty to available/occupied for tables.

DO $$ 
BEGIN 
    -- 1. Drop the existing constraint
    ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;

    -- 2. Add the updated constraint including 'available'
    -- We keep 'clean' and 'dirty' for backward compatibility with hotel rooms
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check 
    CHECK (status IN ('clean', 'dirty', 'maintenance', 'occupied', 'available'));

    -- 3. Optional: Update existing 'clean' tables to 'available'
    -- This ensures consistency for existing data
    -- Only update if the room is of a type that is a 'table'
    UPDATE public.rooms r
    SET status = 'available'
    FROM public.room_types rt
    WHERE r.room_type_id = rt.id 
    AND rt.category = 'table' 
    AND r.status = 'clean';

END $$;
