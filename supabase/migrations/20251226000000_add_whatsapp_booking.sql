-- Add WhatsApp Booking Phone to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS whatsapp_booking_phone TEXT;
