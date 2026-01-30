-- 1. Clean up duplicate license plans (keep the most recently created one for each duration)
DELETE FROM public.license_plans a
USING public.license_plans b
WHERE a.id < b.id 
  AND a.duration_days = b.duration_days;

-- 2. Add a unique constraint to prevent future duplicates
-- We use duration_days as the unique key
ALTER TABLE public.license_plans 
ADD CONSTRAINT license_plans_duration_days_key UNIQUE (duration_days);

-- 3. Update the seed data to use the new constraint
-- This ensures that running the migration multiple times won't create duplicates
INSERT INTO public.license_plans (name, duration_days, price) VALUES
('1 Month', 30, 49.00),
('3 Months', 90, 135.00),
('6 Months', 180, 250.00),
('1 Year', 365, 450.00),
('2 Years', 730, 800.00),
('Lifetime', 36500, 2500.00)
ON CONFLICT (duration_days) 
DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price;
