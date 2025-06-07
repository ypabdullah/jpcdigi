-- Create the api_credentials table
CREATE TABLE IF NOT EXISTS public.api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(255) NOT NULL,
  key_name VARCHAR(255) NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all credentials
CREATE POLICY "Allow authenticated users to read credentials" 
  ON public.api_credentials
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert credentials
CREATE POLICY "Allow authenticated users to insert credentials" 
  ON public.api_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update their credentials
CREATE POLICY "Allow authenticated users to update credentials" 
  ON public.api_credentials
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add some initial data for Digiflazz (optional)
INSERT INTO public.api_credentials (provider, key_name, key_value, is_active)
VALUES 
  ('digiflazz', 'username', '', true),
  ('digiflazz', 'api_key', '', true);
