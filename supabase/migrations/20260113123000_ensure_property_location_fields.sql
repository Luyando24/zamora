-- Ensure city and country columns exist in properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Zambia';
