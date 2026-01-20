-- Add payment_status column to orders and bar_orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

ALTER TABLE bar_orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create function to auto-update payment status
CREATE OR REPLACE FUNCTION public.auto_update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes to 'delivered', set payment_status to 'paid'
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    NEW.payment_status := 'paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if exist to avoid duplicates
DROP TRIGGER IF EXISTS trg_auto_pay_orders ON orders;
DROP TRIGGER IF EXISTS trg_auto_pay_bar_orders ON bar_orders;

-- Attach triggers
CREATE TRIGGER trg_auto_pay_orders
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_payment_status();

CREATE TRIGGER trg_auto_pay_bar_orders
BEFORE UPDATE ON bar_orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_payment_status();
