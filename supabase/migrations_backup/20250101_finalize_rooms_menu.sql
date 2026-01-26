-- Enhance rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'clean',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add check constraint for room status if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check') THEN 
        ALTER TABLE rooms ADD CONSTRAINT rooms_status_check 
        CHECK (status IN ('clean', 'dirty', 'maintenance', 'occupied', 'available'));
    END IF; 
END $$;

-- Enhance menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_property_id ON menu_items(property_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
