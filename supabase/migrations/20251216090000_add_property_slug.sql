-- Add Slug to properties table for wildcard domain support
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
