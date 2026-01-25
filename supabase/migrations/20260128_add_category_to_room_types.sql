-- Add category column to room_types to distinguish between hotel rooms and restaurant tables
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'room' CHECK (category IN ('room', 'table'));

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_room_types_category ON room_types(category);
