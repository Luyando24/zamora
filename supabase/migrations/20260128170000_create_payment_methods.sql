
-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for payment methods" ON payment_methods
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage payment methods" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM property_staff
      WHERE property_staff.property_id = payment_methods.property_id
      AND property_staff.user_id = auth.uid()
      AND property_staff.role IN ('manager', 'owner', 'admin')
    )
  );
