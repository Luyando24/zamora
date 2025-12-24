-- Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Enable RLS
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own saved properties" ON saved_properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved properties" ON saved_properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved properties" ON saved_properties
    FOR DELETE USING (auth.uid() = user_id);
