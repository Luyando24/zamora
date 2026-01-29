-- Create license_plans table
CREATE TABLE IF NOT EXISTS public.license_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.license_plans ENABLE ROW LEVEL SECURITY;

-- Policies for license_plans
-- 1. Everyone can read active plans
CREATE POLICY "Anyone can view active license plans"
ON public.license_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. Super admins can do everything
CREATE POLICY "Super admins have full access to license plans"
ON public.license_plans
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Seed initial plans
INSERT INTO public.license_plans (name, duration_days, price) VALUES
('1 Month', 30, 49.00),
('3 Months', 90, 135.00),
('6 Months', 180, 250.00),
('1 Year', 365, 450.00),
('2 Years', 730, 800.00),
('Lifetime', 36500, 2500.00)
ON CONFLICT DO NOTHING;
