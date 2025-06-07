import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { createAndSendOTP, verifyOTP, getResendCooldownRemaining } from "@/services/otp-service";

interface OtpVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: () => void;
}

export const OtpVerification = ({ phoneNumber, onVerificationSuccess }: OtpVerificationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  // Memulai countdown untuk resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Mengirim OTP saat komponen dimuat dan memeriksa cooldown
  useEffect(() => {
    const initializeOTP = async () => {
      if (user) {
        const remainingTime = await getResendCooldownRemaining(user.id);
        if (remainingTime > 0) {
          // Masih ada cooldown dari percobaan sebelumnya
          setCountdown(remainingTime);
        } else {
          // Tidak ada cooldown, kirim OTP baru
          sendOtp();
        }
      }
    };
    
    initializeOTP();
  }, [user]);

  const sendOtp = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const success = await createAndSendOTP(user.id, phoneNumber);
      
      if (success) {
        toast({
          title: "Kode OTP Terkirim",
          description: `Kode verifikasi telah dikirim ke WhatsApp ${phoneNumber}`,
        });
        // Set countdown untuk 60 detik
        setCountdown(60);
      } else {
        setError("Gagal mengirim kode OTP. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!user || !otpCode) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const success = await verifyOTP(user.id, otpCode);
      
      if (success) {
        toast({
          title: "Verifikasi Berhasil",
          description: "Nomor WhatsApp Anda telah diverifikasi.",
        });
        onVerificationSuccess();
      } else {
        const errorMsg = "Kode OTP tidak valid atau sudah kedaluwarsa";
        setError(errorMsg);
        toast({
          variant: "destructive",
          title: "Verifikasi Gagal",
          description: errorMsg,
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    sendOtp();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verifikasi WhatsApp</CardTitle>
        <CardDescription>
          Masukkan kode 6 digit yang dikirim ke WhatsApp Anda {phoneNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Masukkan kode OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").substring(0, 6))}
            className="text-center text-lg tracking-wider"
            maxLength={6}
            inputMode="numeric"
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div className="text-center text-sm">
            {countdown > 0 ? (
              <p>Kirim ulang dalam {countdown} detik</p>
            ) : (
              <button 
                onClick={handleResendOtp} 
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Kirim Ulang Kode
              </button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={verifyOtp} 
          className="w-full" 
          disabled={otpCode.length !== 6 || isLoading}
        >
          {isLoading ? "Memverifikasi..." : "Verifikasi"}
        </Button>
      </CardFooter>
    </Card>
  );
};
