-- Add cover image and gallery support to hotels table
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create a storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'property-images' );

-- Policy: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own uploads
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'property-images' AND auth.uid() = owner
);
