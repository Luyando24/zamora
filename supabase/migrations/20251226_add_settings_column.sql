-- Add settings JSONB column to properties table for flexible storage
-- This allows storing type-specific data (e.g., restaurant cuisine, opening hours) without creating separate tables.

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN properties.settings IS 'Flexible storage for property-specific settings (e.g., restaurant details, hotel policies)';
