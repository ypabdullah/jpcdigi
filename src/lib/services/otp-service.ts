import { supabase } from "@/integrations/supabase/client";
import { sendWhatsAppMessage } from "@/integrations/whatsapp/api";

interface OtpVerificationRecord {
  id: string;
  user_id: string;
  phone_number: string;
  otp_code: string;
  is_verified: boolean;
  created_at: string;
  expires_at: string;
  attempts: number;
}

class OtpService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  
  /**
   * Generate random numeric OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Generate expiry timestamp for OTP
   */
  private getExpiryTimestamp(): string {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + this.OTP_EXPIRY_MINUTES);
    return expiryDate.toISOString();
  }
  
  /**
   * Create new OTP record and send via WhatsApp
   */
  public async generateAndSendOtp(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      // Generate OTP code
      const otpCode = this.generateOtpCode();
      const expiryTimestamp = this.getExpiryTimestamp();
      
      // Check if there's an existing unverified OTP
      const { data: existingOtp } = await supabase
        .from('otp_verification')
        .select('*')
        .eq('user_id', userId)
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // If found and still valid, delete it
      if (existingOtp) {
        await supabase
          .from('otp_verification')
          .delete()
          .eq('id', existingOtp.id);
      }
      
      // Create new OTP record
      const { error: insertError } = await supabase
        .from('otp_verification')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          otp_code: otpCode,
          expires_at: expiryTimestamp,
          is_verified: false,
          attempts: 0
        });
      
      if (insertError) {
        console.error('Error creating OTP record:', insertError);
        return false;
      }
      
      // Send OTP via WhatsApp
      const message = `Kode verifikasi Anda adalah: *${otpCode}*. Kode ini berlaku selama ${this.OTP_EXPIRY_MINUTES} menit.`;
      const sent = await this.sendOtpWhatsApp(phoneNumber, message);
      
      return sent;
    } catch (error) {
      console.error('Error in generateAndSendOtp:', error);
      return false;
    }
  }
  
  /**
   * Send OTP message via WhatsApp
   */
  private async sendOtpWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Format nomor telepon jika perlu
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Kirim pesan WhatsApp
      await sendWhatsAppMessage(formattedPhone, message);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error);
      return false;
    }
  }
  
  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove spaces, dashes, etc.
    let formatted = phoneNumber.replace(/[^0-9]/g, '');
    
    // Ensure it starts with country code
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.substring(1);
    } else if (!formatted.startsWith('62')) {
      formatted = '62' + formatted;
    }
    
    return formatted;
  }
  
  /**
   * Verify OTP code entered by user
   */
  public async verifyOtp(userId: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get latest OTP record for user
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_verification')
        .select('*')
        .eq('user_id', userId)
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError || !otpRecord) {
        return { 
          success: false, 
          message: 'Kode OTP tidak ditemukan. Silakan minta kode baru.' 
        };
      }
      
      // Check if OTP is expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        return { 
          success: false, 
          message: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' 
        };
      }
      
      // Check if max attempts exceeded
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        return { 
          success: false, 
          message: 'Terlalu banyak percobaan. Silakan minta kode baru.' 
        };
      }
      
      // Increment attempt count
      const { error: updateError } = await supabase
        .from('otp_verification')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      
      if (updateError) {
        console.error('Error updating attempt count:', updateError);
      }
      
      // Check if OTP matches
      if (otpRecord.otp_code !== otpCode) {
        return { 
          success: false, 
          message: 'Kode OTP tidak valid. Silakan coba lagi.' 
        };
      }
      
      // Mark as verified
      const { error: verifyError } = await supabase
        .from('otp_verification')
        .update({ is_verified: true })
        .eq('id', otpRecord.id);
      
      if (verifyError) {
        console.error('Error marking OTP as verified:', verifyError);
        return { 
          success: false, 
          message: 'Terjadi kesalahan saat verifikasi. Silakan coba lagi.' 
        };
      }
      
      // Also update user profile to mark as verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_phone_verified: true })
        .eq('id', userId);
        
      if (profileError) {
        console.error('Error updating profile verification status:', profileError);
      }
      
      return { 
        success: true, 
        message: 'Verifikasi berhasil.' 
      };
    } catch (error) {
      console.error('Error in verifyOtp:', error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat verifikasi. Silakan coba lagi.' 
      };
    }
  }
  
  /**
   * Check if user's phone is verified
   */
  public async isPhoneVerified(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_phone_verified')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.is_phone_verified === true;
    } catch (error) {
      console.error('Error checking phone verification:', error);
      return false;
    }
  }
}

export const otpService = new OtpService();
