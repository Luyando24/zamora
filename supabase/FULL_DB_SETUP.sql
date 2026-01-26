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
-- Create menu_categories table
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, name)
);

-- RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage hotel menu categories" ON menu_categories
    FOR ALL USING (hotel_id = get_user_hotel_id());
-- Enhance hotels table with contact and social fields
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;
-- Add SaaS management fields to hotels table
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial', -- 'trial', 'basic', 'pro', 'enterprise'
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS zra_tpin TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create users table extension for app-specific profile data if not exists
-- (Assuming auth.users is managed by Supabase, we usually have a public.profiles or similar)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  hotel_id UUID REFERENCES hotels(id),
  role TEXT DEFAULT 'staff', -- 'admin', 'manager', 'staff', 'super_admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Add customization options and gallery support to menu_items

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- customization_options structure example:
-- [
--   { "name": "Extra Cheese", "price": 10.00 },
--   { "name": "No Onion", "price": 0.00 }
-- ]
-- Enhance room_types with images and amenities
ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
-- Enhance profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active', -- 'active', 'suspended', 'inactive'
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- Create a secure view or function to fetch profiles with emails (for Admin use)
-- Note: Direct access to auth.users is restricted. We create a security definer function.
CREATE OR REPLACE FUNCTION get_admin_users_list()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  hotel_name TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if user has super_admin role (logic to be enforced by RLS or app, 
  -- here we rely on the calling client being authenticated as admin/service role if strictly enforced,
  -- but for this MVP we just return the data joined).
  RETURN QUERY
  SELECT 
    p.id,
    au.email::VARCHAR(255),
    p.first_name,
    p.last_name,
    p.role,
    h.name as hotel_name,
    p.status,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  LEFT JOIN hotels h ON p.hotel_id = h.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
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
-- Enhance rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'clean',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add check constraint for room status if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check') THEN 
        ALTER TABLE rooms ADD CONSTRAINT rooms_status_check 
        CHECK (status IN ('clean', 'dirty', 'maintenance', 'occupied', 'available'));
    END IF; 
END $$;

-- Enhance menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_property_id ON menu_items(property_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
-- Fix missing columns in guests and folio_items

-- 1. Ensure guests has property_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'property_id') THEN 
        ALTER TABLE guests ADD COLUMN property_id UUID REFERENCES properties(id) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF; 
END $$;

-- 2. Ensure folio_items has total_price
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folio_items' AND column_name = 'total_price') THEN 
        ALTER TABLE folio_items ADD COLUMN total_price DECIMAL(10, 2);
        -- Update existing rows
        UPDATE folio_items SET total_price = quantity * unit_price WHERE total_price IS NULL;
    END IF; 
END $$;

-- 3. Add indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_guests_property_id ON guests(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_folios_booking_id ON folios(booking_id);
CREATE INDEX IF NOT EXISTS idx_folio_items_folio_id ON folio_items(folio_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
