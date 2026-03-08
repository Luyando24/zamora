
-- Add created_by column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add RLS policy for created_by if needed (usually covered by hotel_id check, but good for audit)
-- No strict need for new policy if existing ones use hotel_id.
