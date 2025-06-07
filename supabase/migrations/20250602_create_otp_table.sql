-- Create OTP verification table
CREATE TABLE IF NOT EXISTS public.otp_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0
);

-- Add RLS policies
ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own OTP records
CREATE POLICY "Users can read their own OTP records" ON public.otp_verification 
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow backend to create OTP records
CREATE POLICY "Backend can create OTP records" ON public.otp_verification 
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own OTP records
CREATE POLICY "Users can update their own OTP records" ON public.otp_verification 
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX otp_verification_user_id_idx ON public.otp_verification(user_id);
CREATE INDEX otp_verification_phone_number_idx ON public.otp_verification(phone_number);
