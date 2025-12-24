-- Fix cascading deletes for property deletion
-- This migration ensures that when a property (or room) is deleted, all related records
-- (bookings, orders, etc.) are also deleted instead of causing foreign key errors.

-- 1. Bookings -> Rooms (The immediate error)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_room_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- 2. Orders -> Rooms
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_room_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- 3. Orders -> Bookings
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_booking_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- 4. Folios -> Bookings
ALTER TABLE folios DROP CONSTRAINT IF EXISTS folios_booking_id_fkey;
ALTER TABLE folios ADD CONSTRAINT folios_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- 5. Housekeeping Logs -> Rooms
ALTER TABLE housekeeping_logs DROP CONSTRAINT IF EXISTS housekeeping_logs_room_id_fkey;
ALTER TABLE housekeeping_logs ADD CONSTRAINT housekeeping_logs_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- 6. Maintenance Requests -> Rooms
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_room_id_fkey;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- 7. Bookings -> Guests (If guests are deleted, bookings should go too)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_guest_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_guest_id_fkey 
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;

-- 8. Order Items -> Orders (Should be CASCADE already, but ensuring)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- 9. Folio Items -> Folios (Should be CASCADE already, but ensuring)
ALTER TABLE folio_items DROP CONSTRAINT IF EXISTS folio_items_folio_id_fkey;
ALTER TABLE folio_items ADD CONSTRAINT folio_items_folio_id_fkey 
    FOREIGN KEY (folio_id) REFERENCES folios(id) ON DELETE CASCADE;

-- 10. ZRA Transactions -> Folios
ALTER TABLE zra_transactions DROP CONSTRAINT IF EXISTS zra_transactions_folio_id_fkey;
ALTER TABLE zra_transactions ADD CONSTRAINT zra_transactions_folio_id_fkey 
    FOREIGN KEY (folio_id) REFERENCES folios(id) ON DELETE CASCADE;
