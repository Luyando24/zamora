-- Add payment fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
