-- 1. ORDER ITEMS (Links Orders to Menu Items)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT, -- "No onions", etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hotel order items" ON order_items
    FOR ALL USING (order_id IN (SELECT id FROM orders WHERE hotel_id = get_user_hotel_id()));

-- 2. HOUSEKEEPING LOGS (Audit trail for room cleaning)
CREATE TABLE housekeeping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    room_id UUID REFERENCES rooms(id) NOT NULL,
    cleaned_by UUID REFERENCES profiles(id), -- User who cleaned
    status_from TEXT, -- dirty
    status_to TEXT, -- clean
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for housekeeping_logs
ALTER TABLE housekeeping_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hotel housekeeping logs" ON housekeeping_logs
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- 3. MAINTENANCE REQUESTS (For Rooms Management)
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    room_id UUID REFERENCES rooms(id) NOT NULL,
    reported_by UUID REFERENCES profiles(id),
    issue_description TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    status TEXT DEFAULT 'open', -- open, in_progress, resolved
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for maintenance_requests
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hotel maintenance requests" ON maintenance_requests
    FOR ALL USING (hotel_id = get_user_hotel_id());
