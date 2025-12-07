-- Add amenities to hotels table
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
