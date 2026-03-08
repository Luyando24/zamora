-- Enhance licenses table with duration and expiration logic
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 365,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add a comment to explain the logic
COMMENT ON COLUMN public.licenses.duration_days IS 'Number of days the license is valid for after activation';
COMMENT ON COLUMN public.licenses.expires_at IS 'The exact timestamp when the license expires (calculated at activation)';

-- Update properties table to track license expiration
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMP WITH TIME ZONE;
