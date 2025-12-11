-- MENU ITEMS (Food & Beverages)
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Food', -- Food, Drink, Alcohol, etc.
    price DECIMAL(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hotel menu items" ON menu_items
    FOR ALL USING (hotel_id = get_user_hotel_id());
