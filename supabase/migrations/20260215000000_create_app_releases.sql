-- Create app_releases table for software management
CREATE TABLE IF NOT EXISTS public.app_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    download_url TEXT NOT NULL,
    release_notes TEXT,
    platform TEXT NOT NULL,
    is_latest BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

-- Policies for app_releases
-- 1. Public can view releases (for landing page)
CREATE POLICY "Public can view app releases"
ON public.app_releases
FOR SELECT
TO public
USING (true);

-- 2. Super admins have full access
CREATE POLICY "Super admins have full access to app releases"
ON public.app_releases
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Create a storage bucket for software binaries
INSERT INTO storage.buckets (id, name, public) 
VALUES ('software', 'software', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to software bucket
CREATE POLICY "Public Access to software" 
ON storage.objects 
FOR SELECT 
USING ( bucket_id = 'software' );

-- Policy: Allow super admins to upload to software bucket
CREATE POLICY "Super admins can upload software" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'software' 
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Policy: Allow super admins to delete from software bucket
CREATE POLICY "Super admins can delete software" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'software' 
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);
