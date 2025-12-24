-- Create places table for non-accommodation entities (Restaurants, Malls, Museums, etc.)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Restaurant', 'Shopping', 'Museum', 'Park', etc.
    type TEXT, -- More specific: 'Steakhouse', 'Art Gallery', 'Shopping Mall'
    address TEXT,
    city TEXT DEFAULT 'Lusaka',
    country TEXT DEFAULT 'Zambia',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    cover_image_url TEXT,
    gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    opening_hours TEXT, -- Could be JSONB for structured hours, but TEXT is simpler for MVP
    contact_phone TEXT,
    contact_email TEXT,
    website_url TEXT,
    price_range TEXT, -- '$', '$$', '$$$'
    average_rating NUMERIC(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    is_verified BOOLEAN DEFAULT false
);

-- Create activities table for "Things to do"
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    duration TEXT, -- '2 hours', 'Full Day'
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'ZMW',
    category TEXT, -- 'Safari', 'Adventure', 'Culture'
    cover_image_url TEXT,
    gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    average_rating NUMERIC(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Places
CREATE POLICY "Public can view places" ON places
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create places" ON places
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own places" ON places
    FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Users can delete own places" ON places
    FOR DELETE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- RLS Policies for Activities
CREATE POLICY "Public can view activities" ON activities
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create activities" ON activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own activities" ON activities
    FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Users can delete own activities" ON activities
    FOR DELETE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Allow reviews to link to places and activities
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS place_id UUID REFERENCES places(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Update review trigger to handle places and activities
CREATE OR REPLACE FUNCTION update_entity_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.property_id IS NOT NULL THEN
        UPDATE properties
        SET average_rating = (SELECT AVG(rating) FROM reviews WHERE property_id = NEW.property_id),
            review_count = (SELECT COUNT(*) FROM reviews WHERE property_id = NEW.property_id)
        WHERE id = NEW.property_id;
    ELSIF NEW.place_id IS NOT NULL THEN
        UPDATE places
        SET average_rating = (SELECT AVG(rating) FROM reviews WHERE place_id = NEW.place_id),
            review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = NEW.place_id)
        WHERE id = NEW.place_id;
    ELSIF NEW.activity_id IS NOT NULL THEN
        UPDATE activities
        SET average_rating = (SELECT AVG(rating) FROM reviews WHERE activity_id = NEW.activity_id),
            review_count = (SELECT COUNT(*) FROM reviews WHERE activity_id = NEW.activity_id)
        WHERE id = NEW.activity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_property_rating_trigger ON reviews;
CREATE TRIGGER update_entity_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_entity_rating();
