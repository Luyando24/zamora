-- Create a storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Policy: Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'menu-images' );

-- Policy: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own uploads (simplified for demo)
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'menu-images' AND auth.uid() = owner
);
