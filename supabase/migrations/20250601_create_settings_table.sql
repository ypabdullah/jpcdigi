-- Create settings table if not exists
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all users" ON public.settings 
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow write access to all authenticated users (for simplicity in development)
CREATE POLICY "Allow write access to all authenticated users" ON public.settings 
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update to all authenticated users" ON public.settings 
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Insert default business hours settings if not exist
INSERT INTO public.settings (key, value)
VALUES (
    'business_hours',
    '{
        "isEnabled": false,
        "workingDays": [
            {"day": "monday", "isActive": true, "openTime": "08:00", "closeTime": "17:00"},
            {"day": "tuesday", "isActive": true, "openTime": "08:00", "closeTime": "17:00"},
            {"day": "wednesday", "isActive": true, "openTime": "08:00", "closeTime": "17:00"},
            {"day": "thursday", "isActive": true, "openTime": "08:00", "closeTime": "17:00"},
            {"day": "friday", "isActive": true, "openTime": "08:00", "closeTime": "17:00"},
            {"day": "saturday", "isActive": true, "openTime": "08:00", "closeTime": "15:00"},
            {"day": "sunday", "isActive": false, "openTime": "08:00", "closeTime": "15:00"}
        ],
        "offWorkMessage": "Maaf, kami sedang tutup. Silakan kembali pada jam operasional kami."
    }'
) ON CONFLICT (key) DO NOTHING;
