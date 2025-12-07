-- Fix Storage Policies for 'room-images' and ensure bucket exists
-- Run this in your Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts or stale rules
DROP POLICY IF EXISTS "Public Access Room Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload room images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own room images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own room images" ON storage.objects;

-- 3. Create permissive policies for room images

-- Allow public read access (anyone can view images)
CREATE POLICY "Public Access Room Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'room-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update images in this bucket
CREATE POLICY "Authenticated users can update room images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'room-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete images in this bucket
CREATE POLICY "Authenticated users can delete room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images' 
  AND auth.role() = 'authenticated'
);
