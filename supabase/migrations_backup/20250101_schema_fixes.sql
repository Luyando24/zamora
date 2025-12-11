-- Fix missing columns in guests and folio_items

-- 1. Ensure guests has hotel_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'hotel_id') THEN 
        ALTER TABLE guests ADD COLUMN hotel_id UUID REFERENCES hotels(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'; -- Temporary default to avoid error on existing rows, ideally should be handled
        -- If table is empty, NOT NULL is fine. If not, we might need to handle it.
        -- Removing default after adding if needed, but for now keep simple.
    END IF; 
END $$;

-- 2. Ensure folio_items has total_price
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folio_items' AND column_name = 'total_price') THEN 
        ALTER TABLE folio_items ADD COLUMN total_price DECIMAL(10, 2);
        -- Update existing rows
        UPDATE folio_items SET total_price = quantity * unit_price WHERE total_price IS NULL;
    END IF; 
END $$;

-- 3. Add indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_guests_hotel_id ON guests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_folios_booking_id ON folios(booking_id);
CREATE INDEX IF NOT EXISTS idx_folio_items_folio_id ON folio_items(folio_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
