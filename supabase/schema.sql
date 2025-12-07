-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOTELS (Tenants)
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    address TEXT,
    zra_tpin TEXT, -- Tax Payer Identification Number
    logo_url TEXT
);

-- 2. PROFILES (Users linked to Hotels)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    hotel_id UUID REFERENCES hotels(id),
    full_name TEXT,
    role TEXT DEFAULT 'staff', -- manager, staff, housekeeping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROOM TYPES
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    capacity INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ROOMS
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    room_type_id UUID REFERENCES room_types(id),
    room_number TEXT NOT NULL,
    status TEXT DEFAULT 'clean', -- clean, dirty, maintenance, occupied
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, room_number)
);

-- 5. GUESTS
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    identification_number TEXT, -- NRC or Passport
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    guest_id UUID REFERENCES guests(id) NOT NULL,
    room_id UUID REFERENCES rooms(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status TEXT DEFAULT 'confirmed', -- confirmed, checked_in, checked_out, cancelled
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. FOLIOS (Bills)
CREATE TABLE folios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    status TEXT DEFAULT 'open', -- open, closed, paid
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_method TEXT, -- cash, card, momo
    zra_invoice_number TEXT,
    zra_mark_id TEXT,
    zra_qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. FOLIO ITEMS (Line Items)
CREATE TABLE folio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio_id UUID REFERENCES folios(id) NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    tax_category TEXT DEFAULT 'A', -- ZRA Tax Categories (A=16%, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ORDERS (Food/Services)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    room_id UUID REFERENCES rooms(id),
    status TEXT DEFAULT 'pending', -- pending, preparing, delivered, cancelled
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ZRA TRANSACTIONS (Audit Log)
CREATE TABLE zra_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    folio_id UUID REFERENCES folios(id),
    request_payload JSONB,
    response_payload JSONB,
    status TEXT, -- success, error
    vsdc_approval_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES ------------------------------------------------

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zra_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's hotel_id
CREATE OR REPLACE FUNCTION get_user_hotel_id()
RETURNS UUID AS $$
  SELECT hotel_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy Template: Users can only see data for their own hotel
-- Hotels: Users can view their own hotel
CREATE POLICY "Users can view own hotel" ON hotels
    FOR SELECT USING (id = get_user_hotel_id());

-- Profiles: Users can view profiles in their hotel
CREATE POLICY "Users can view colleagues" ON profiles
    FOR SELECT USING (hotel_id = get_user_hotel_id());

-- Room Types
CREATE POLICY "Users can view hotel room types" ON room_types
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- Rooms
CREATE POLICY "Users can view hotel rooms" ON rooms
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- Guests
CREATE POLICY "Users can view hotel guests" ON guests
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- Bookings
CREATE POLICY "Users can view hotel bookings" ON bookings
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- Folios
CREATE POLICY "Users can view hotel folios" ON folios
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- Folio Items
CREATE POLICY "Users can view hotel folio items" ON folio_items
    FOR ALL USING (folio_id IN (SELECT id FROM folios WHERE hotel_id = get_user_hotel_id()));

-- Orders
CREATE POLICY "Users can view hotel orders" ON orders
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- ZRA Transactions
CREATE POLICY "Users can view hotel ZRA transactions" ON zra_transactions
    FOR ALL USING (hotel_id = get_user_hotel_id());

-- REALTIME SUBSCRIPTIONS --------------------------------------
-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

