import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneNumberForWhatsApp } from "@/utils/format";

export default function WhatsappVerificationPage() {
  const { user, isPhoneVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  
  // Tambahkan ref untuk mencegah multiple redirects
  const hasRedirected = useRef(false);
  const verificationCheckComplete = useRef(false);

  useEffect(() => {
    // Periksa status verifikasi hanya sekali saat halaman dimuat
    if (!verificationCheckComplete.current) {
      checkVerificationStatus();
      verificationCheckComplete.current = true;
    }
    
    // Tambahkan event listener untuk mendeteksi kembali ke halaman ini
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isVerified && !hasRedirected.current) {
        hasRedirected.current = true;
        navigate('/');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVerified]);

  const checkVerificationStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Periksa apakah nomor WhatsApp sudah diverifikasi dari AuthContext
      if (isPhoneVerified) {
        setIsVerified(true);
        setIsLoading(false);
        
        // Redirect ke home hanya jika belum pernah redirect sebelumnya
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          // Gunakan setTimeout untuk menghindari throttling
          setTimeout(() => navigate("/"), 100);
        }
        return;
      }
      
      // Ambil data profil dari database
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_phone_verified, phone")
        .eq("id", user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setIsLoading(false);
        return;
      }
      
      setIsVerified(profileData?.is_phone_verified === true);
      
      // Jika sudah terverifikasi tetapi AuthContext belum update
      if (profileData?.is_phone_verified && !hasRedirected.current) {
        hasRedirected.current = true;
        // Gunakan setTimeout untuk menghindari throttling
        setTimeout(() => navigate("/"), 100);
        return;
      }
      
      // Jika tidak ada nomor telepon dan belum pernah redirect
      if (!profileData?.phone && !hasRedirected.current) {
        hasRedirected.current = true;
        // Gunakan setTimeout untuk menghindari throttling
        setTimeout(() => navigate("/profile?redirect=verification"), 100);
        return;
      }
      
      setPhoneNumber(profileData?.phone || "");
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    // Gunakan ref untuk mencegah multiple redirects
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      
      // Tampilkan pesan sukses sebentar
      setTimeout(() => {
        // Simpan flag di localStorage untuk refresh setelah redirect
        localStorage.setItem('whatsapp_verification_success', 'true');
        // Redirect ke home page
        navigate('/');
      }, 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg">Memeriksa status verifikasi...</p>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Verifikasi Berhasil!</h1>
          <p className="mb-4">Nomor WhatsApp Anda telah diverifikasi berhasil.</p>
          <p className="text-sm text-muted-foreground">Mengalihkan ke halaman utama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Verifikasi WhatsApp</h1>
        <p className="text-center mb-6 text-muted-foreground">
          Untuk keamanan akun Anda, kami perlu memverifikasi nomor WhatsApp Anda sebelum Anda dapat menggunakan aplikasi.
        </p>
        
        {phoneNumber ? (
          <OtpVerification
            phoneNumber={phoneNumber}
            onVerificationSuccess={handleVerificationSuccess}
          />
        ) : (
          <div className="text-center">
            <p className="text-red-500">Verifikasi Berhasil.</p>
            <button
              onClick={() => navigate("/profile?redirect=verification")}
              className="mt-4 text-primary hover:underline"
            >
              Lanjutkan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
