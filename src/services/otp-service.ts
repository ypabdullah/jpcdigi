import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumberForWhatsApp } from '@/utils/format';
import { sendWhatsAppMessage } from '@/integrations/whatsapp/api';

// Alternatif API Key untuk CallMeBot (jika digunakan)
const CALLMEBOT_API_KEY = import.meta.env.VITE_CALLMEBOT_API_KEY || '';

// Konfigurasi OTP
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

// Menggunakan formatPhoneNumberForWhatsApp dari utils/format.ts

/**
 * Generate kode OTP acak
 */
export const generateOTPCode = (length: number = OTP_LENGTH): string => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

/**
 * Kirim kode OTP melalui WhatsApp ke nomor telepon yang diberikan
 */
export const sendOTPViaWhatsApp = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
  // Format nomor telepon untuk API WhatsApp (pastikan diawali dengan 62)
  const formattedPhoneNumber = formatPhoneNumberForWhatsApp(phoneNumber);
  
  try {
    // Buat pesan OTP
    const message = `*Kode OTP untuk JPC*\n\nKode verifikasi Anda adalah: *${otpCode}*\n\nKode ini berlaku selama ${OTP_EXPIRY_MINUTES} menit.\nJangan bagikan kode ini dengan siapapun.`;

    // Kirim menggunakan fungsi WhatsApp API yang sudah ada
    const success = await sendWhatsAppMessage(formattedPhoneNumber, message);

    console.log('WhatsApp OTP sent successfully:', success);
    return success;
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    return false;
  }
};

/**
 * Buat dan kirim kode OTP baru untuk verifikasi pengguna
 */
export const createAndSendOTP = async (userId: string, phoneNumber: string): Promise<boolean> => {
  try {
    // Generate kode OTP
    const otpCode = generateOTPCode();
    
    // Hitung waktu kedaluwarsa (5 menit dari sekarang)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
    
    // Simpan OTP di database
    const { error } = await supabase.from('otp_verification').insert({
      user_id: userId,
      phone_number: phoneNumber,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      is_verified: false,
    });

    if (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
    
    // Kirim OTP melalui WhatsApp
    return await sendOTPViaWhatsApp(phoneNumber, otpCode);
  } catch (error) {
    console.error('Error in createAndSendOTP:', error);
    return false;
  }
};

/**
 * Verifikasi kode OTP untuk pengguna
 */
export const verifyOTP = async (userId: string, otpCode: string): Promise<boolean> => {
  try {
    // Dapatkan OTP terbaru yang belum diverifikasi untuk pengguna ini
    const { data: otpData, error: fetchError } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('user_id', userId)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !otpData) {
      console.error('Error fetching OTP:', fetchError);
      return false;
    }
    
    // Periksa apakah OTP sudah kedaluwarsa
    const now = new Date();
    const expiresAt = new Date(otpData.expires_at);
    if (now > expiresAt) {
      console.log('OTP has expired');
      return false;
    }
    
    // Periksa apakah jumlah percobaan maksimum tercapai
    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
      console.log('Max OTP attempts reached');
      return false;
    }
    
    // Tambahkan jumlah percobaan
    const { error: updateError } = await supabase
      .from('otp_verification')
      .update({ attempts: otpData.attempts + 1 })
      .eq('id', otpData.id);
    
    if (updateError) {
      console.error('Error updating OTP attempts:', updateError);
    }
    
    // Periksa apakah OTP cocok
    if (otpData.otp_code !== otpCode) {
      return false;
    }
    
    // OTP valid, tandai sebagai terverifikasi dan perbarui profil pengguna
    const { error: verifyError } = await supabase
      .from('otp_verification')
      .update({ is_verified: true })
      .eq('id', otpData.id);
    
    if (verifyError) {
      console.error('Error marking OTP as verified:', verifyError);
      return false;
    }
    
    // Perbarui profil pengguna untuk menandai telepon sebagai terverifikasi
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_phone_verified: true,
        phone_verified_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error updating profile phone verification status:', profileError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return false;
  }
};

/**
 * Periksa apakah pengguna dapat mengirim ulang OTP (periode cooldown)
 */
export const canResendOTP = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('otp_verification')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // Jika tidak ada OTP yang ditemukan, pengguna dapat mengirim yang baru
      return true;
    }
    
    const lastSentAt = new Date(data.created_at);
    const cooldownEndsAt = new Date(lastSentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000);
    const now = new Date();
    
    return now > cooldownEndsAt;
  } catch (error) {
    console.error('Error in canResendOTP:', error);
    return true; // Default untuk mengizinkan pengiriman ulang jika terjadi kesalahan
  }
};

/**
 * Dapatkan waktu yang tersisa sebelum pengguna dapat mengirim ulang OTP
 * @returns Jumlah detik yang tersisa sebelum pengiriman ulang diizinkan, atau 0 jika dapat mengirim sekarang
 */
export const getResendCooldownRemaining = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('otp_verification')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return 0; // Tidak ada OTP yang ditemukan, dapat mengirim segera
    }
    
    const lastSentAt = new Date(data.created_at);
    const cooldownEndsAt = new Date(lastSentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000);
    const now = new Date();
    
    if (now > cooldownEndsAt) {
      return 0; // Periode cooldown telah berlalu
    }
    
    // Kembalikan detik yang tersisa
    return Math.ceil((cooldownEndsAt.getTime() - now.getTime()) / 1000);
  } catch (error) {
    console.error('Error in getResendCooldownRemaining:', error);
    return 0; // Default untuk mengizinkan pengiriman ulang jika terjadi kesalahan
  }
};
