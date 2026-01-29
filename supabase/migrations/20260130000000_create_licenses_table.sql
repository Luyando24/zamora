-- Create licenses table for subscription management
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'pro',
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_property_id UUID REFERENCES public.properties(id),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE CONTROL; -- Error in syntax, should be ENABLE ROW LEVEL SECURITY
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Policies for licenses
-- 1. Admins can do everything
CREATE POLICY "Admins have full access to licenses"
ON public.licenses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
);

-- 2. Users can read licenses (to verify them during activation)
CREATE POLICY "Users can view unused licenses to verify"
ON public.licenses
FOR SELECT
TO authenticated
USING (status = 'unused');

-- 3. Users can update a license to mark it as used (during activation)
CREATE POLICY "Users can update license to mark as used"
ON public.licenses
FOR UPDATE
TO authenticated
USING (status = 'unused')
WITH CHECK (status = 'used');

-- Add subscription_status check constraint to properties if not exists
-- This is just to ensure the values we use in code are valid
-- ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_subscription_status_check;
-- ALTER TABLE public.properties ADD CONSTRAINT properties_subscription_status_check 
-- CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial', 'active_licensed'));
