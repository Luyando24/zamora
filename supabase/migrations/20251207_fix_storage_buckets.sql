-- Ensure storage buckets exist and have correct policies

-- 1. Property Images Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for property-images
DROP POLICY IF EXISTS "Public Access property-images" ON storage.objects;
CREATE POLICY "Public Access property-images" ON storage.objects FOR SELECT USING ( bucket_id = 'property-images' );

DROP POLICY IF EXISTS "Authenticated users can upload property-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property-images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own property-images" ON storage.objects;
CREATE POLICY "Users can update own property-images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'property-images' AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Users can delete own property-images" ON storage.objects;
CREATE POLICY "Users can delete own property-images" ON storage.objects FOR DELETE USING (
    bucket_id = 'property-images' AND auth.uid() = owner
);


-- 2. Menu Images Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for menu-images
DROP POLICY IF EXISTS "Public Access menu-images" ON storage.objects;
CREATE POLICY "Public Access menu-images" ON storage.objects FOR SELECT USING ( bucket_id = 'menu-images' );

DROP POLICY IF EXISTS "Authenticated users can upload menu-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload menu-images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'menu-images' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own menu-images" ON storage.objects;
CREATE POLICY "Users can update own menu-images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'menu-images' AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Users can delete own menu-images" ON storage.objects;
CREATE POLICY "Users can delete own menu-images" ON storage.objects FOR DELETE USING (
    bucket_id = 'menu-images' AND auth.uid() = owner
);

-- 3. Room Images Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for room-images
DROP POLICY IF EXISTS "Public Access room-images" ON storage.objects;
CREATE POLICY "Public Access room-images" ON storage.objects FOR SELECT USING ( bucket_id = 'room-images' );

DROP POLICY IF EXISTS "Authenticated users can upload room-images" ON storage.objects;
CREATE POLICY "Authenticated users can upload room-images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'room-images' AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own room-images" ON storage.objects;
CREATE POLICY "Users can update own room-images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'room-images' AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Users can delete own room-images" ON storage.objects;
CREATE POLICY "Users can delete own room-images" ON storage.objects FOR DELETE USING (
    bucket_id = 'room-images' AND auth.uid() = owner
);
