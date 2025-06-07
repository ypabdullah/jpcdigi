# Sistem Verifikasi WhatsApp OTP

Dokumen ini memberikan gambaran umum tentang sistem verifikasi nomor WhatsApp menggunakan OTP (One Time Password) yang diimplementasikan dalam aplikasi JPC.

## Fitur Utama

- Pengiriman kode OTP ke WhatsApp pelanggan
- Verifikasi kode OTP dengan batas waktu dan percobaan
- Integrasi dengan sistem autentikasi Supabase
- Perlindungan rute untuk memastikan pengguna telah memverifikasi nomor WhatsApp mereka
- Pemformatan nomor telepon Indonesia (awalan 62)
- Manajemen cooldown untuk pengiriman ulang OTP

## Struktur Database

### Tabel otp_verification
```sql
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
```

### Kolom Tambahan di Tabel profiles
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;
```

## Alur Sistem

1. **Pendaftaran Pengguna**
   - Pengguna mendaftar dengan nama, email, kata sandi, dan nomor WhatsApp
   - Nomor WhatsApp diformat ke standar Indonesia (62xxx) dan disimpan di tabel profiles

2. **Login**
   - Saat pengguna login, sistem memeriksa status verifikasi nomor WhatsApp
   - Jika nomor belum terverifikasi, pengguna diarahkan ke halaman verifikasi WhatsApp

3. **Verifikasi OTP**
   - Sistem mengirim kode OTP 6 digit ke nomor WhatsApp pengguna
   - Pengguna memiliki 5 menit untuk memasukkan kode OTP
   - Jika verifikasi berhasil, status `is_phone_verified` diubah menjadi `true` dalam tabel profiles
   - Jika gagal, pengguna dapat mencoba lagi hingga 3 kali sebelum harus meminta kode baru

4. **Pembatasan Akses**
   - Semua rute customer dilindungi dengan komponen `ProtectedRoute`
   - Komponen ini memeriksa status login dan verifikasi nomor WhatsApp
   - Pengguna yang belum login diarahkan ke halaman login
   - Pengguna yang sudah login tapi belum verifikasi diarahkan ke halaman verifikasi WhatsApp

## Komponen Utama

1. **AuthContext.tsx**
   - Menyediakan status `isPhoneVerified`
   - Metode `checkPhoneVerification()` untuk memeriksa status verifikasi
   - Integrasi dengan sistem FCM token untuk notifikasi

2. **OtpVerification.tsx**
   - Komponen UI untuk memasukkan dan memverifikasi kode OTP
   - Menangani cooldown untuk pengiriman ulang OTP
   - Menampilkan pesan status dan kesalahan

3. **WhatsappVerificationPage.tsx**
   - Halaman verifikasi nomor WhatsApp
   - Mengambil nomor WhatsApp dari profil pengguna
   - Mengarahkan pengguna ke halaman utama setelah verifikasi berhasil

4. **otp-service.ts**
   - Layanan untuk membuat, mengirim, dan memverifikasi kode OTP
   - Mengelola percobaan verifikasi dan kedaluwarsa kode
   - Memperbarui status verifikasi dalam database

5. **format.ts**
   - Utilitas untuk memformat nomor telepon Indonesia (62xxx)
   - Memastikan konsistensi format nomor telepon di seluruh aplikasi

## Ketentuan Keamanan

- RLS policy untuk membatasi akses ke tabel OTP dan profil
- Kode OTP kedaluwarsa dalam 5 menit
- Batas 3 kali percobaan untuk setiap kode OTP
- Cooldown 60 detik untuk pengiriman ulang kode OTP
- Verifikasi dan status login diperiksa pada setiap navigasi route

## Contoh Penggunaan WhatsApp API

```typescript
const sendOTPViaWhatsApp = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
  const formattedPhoneNumber = formatPhoneNumberForWhatsApp(phoneNumber);
  
  try {
    const message = `*Kode OTP untuk JPC*\n\nKode verifikasi Anda adalah: *${otpCode}*\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini dengan siapapun.`;

    const response = await axios.post('https://app.wapanels.com/api/send-message', {
      app_key: WAPANELS_API_KEY,
      auth_key: WAPANELS_AUTH_KEY,
      receiver: formattedPhoneNumber,
      message: message,
      type: 'chat', 
    });

    return response.data.status === 'success';
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    return false;
  }
};
```
