-- Menambahkan indeks untuk meningkatkan performa kueri pada tabel otp_verification
CREATE INDEX IF NOT EXISTS idx_otp_verification_user_id ON public.otp_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verification_phone_number ON public.otp_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_verification_created_at ON public.otp_verification(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON public.otp_verification(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verification_is_verified ON public.otp_verification(is_verified);

-- Menambahkan indeks untuk kolom phone_verified di profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_phone_verified ON public.profiles(is_phone_verified);
