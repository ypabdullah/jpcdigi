-- Create vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  description TEXT
);

-- Add index for quick lookup by code
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers (code);

-- Add RLS policies
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read active vouchers
CREATE POLICY "Allow anonymous to read active vouchers" 
  ON public.vouchers FOR SELECT 
  USING (is_active = true AND current_timestamp BETWEEN start_date AND end_date);

-- Allow authenticated users to read active vouchers
CREATE POLICY "Allow authenticated to read active vouchers" 
  ON public.vouchers FOR SELECT 
  TO authenticated
  USING (is_active = true AND current_timestamp BETWEEN start_date AND end_date);

-- Allow admins to manage all vouchers
CREATE POLICY "Allow admins to manage all vouchers" 
  ON public.vouchers FOR ALL 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Add column to orders table for voucher reference
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES public.vouchers(id);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
