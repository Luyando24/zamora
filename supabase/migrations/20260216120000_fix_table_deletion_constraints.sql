-- Fix foreign key constraints to allow table/room deletion by setting the reference to NULL

-- 1. Fix bar_orders.table_id
ALTER TABLE bar_orders
DROP CONSTRAINT IF EXISTS bar_orders_table_id_fkey;

ALTER TABLE bar_orders
ADD CONSTRAINT bar_orders_table_id_fkey
FOREIGN KEY (table_id)
REFERENCES rooms(id)
ON DELETE SET NULL;

-- 2. Fix orders.table_id
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_table_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_table_id_fkey
FOREIGN KEY (table_id)
REFERENCES rooms(id)
ON DELETE SET NULL;

-- 3. Fix orders.room_id (for room service orders)
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_room_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE SET NULL;

-- 4. Fix bookings.room_id
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_room_id_fkey;

ALTER TABLE bookings
ADD CONSTRAINT bookings_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE SET NULL;
