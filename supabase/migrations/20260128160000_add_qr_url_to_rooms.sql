-- Add qr_url column to rooms table to support linking existing QR codes
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS qr_url TEXT;

-- Update the comment to reflect the new column
COMMENT ON TABLE rooms IS 'Rooms/Tables table with support for custom QR code URLs';
