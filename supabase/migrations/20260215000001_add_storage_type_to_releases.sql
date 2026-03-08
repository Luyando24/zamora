-- Add storage_type to app_releases to support Google Drive links
ALTER TABLE public.app_releases 
ADD COLUMN IF NOT EXISTS storage_type TEXT DEFAULT 'supabase';

-- Add a comment for clarity
COMMENT ON COLUMN public.app_releases.storage_type IS 'Type of storage: supabase or google_drive';
