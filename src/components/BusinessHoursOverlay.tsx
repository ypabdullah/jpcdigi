import React, { useEffect, useState, useCallback } from 'react';
import { businessHoursService } from '@/lib/services/business-hours-service';
import { Button } from './ui/button';
import { Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function BusinessHoursOverlay() {
  const [isOutsideBusinessHours, setIsOutsideBusinessHours] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [checkCount, setCheckCount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Gunakan useCallback agar fungsi tidak dibuat ulang setiap render
  const checkBusinessHours = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Dapatkan waktu saat ini untuk debugging
      const now = new Date();
      const formattedTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      setLastChecked(formattedTime);
      
      console.debug(`[BusinessHoursOverlay] Memeriksa jam kerja pada ${formattedTime}`);
      
      const status = await businessHoursService.getCurrentStatus();
      console.debug(`[BusinessHoursOverlay] Status toko: ${status.isOpen ? 'BUKA' : 'TUTUP'}`);
      console.debug(`[BusinessHoursOverlay] Pesan: ${status.message}`);
      
      setIsOutsideBusinessHours(!status.isOpen);
      setMessage(status.message);
      setCheckCount(prev => prev + 1);
    } catch (error) {
      console.error('[BusinessHoursOverlay] Error checking business hours:', error);
      setError('Terjadi kesalahan saat memeriksa jam kerja');
      // Fallback: Jangan tampilkan overlay jika terjadi kesalahan
      setIsOutsideBusinessHours(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Periksa segera saat komponen dimuat
    checkBusinessHours();

    // Memeriksa jam kerja setiap menit
    const intervalId = setInterval(checkBusinessHours, 60000);
    return () => clearInterval(intervalId);
  }, [checkBusinessHours]);

  // Jangan tampilkan overlay jika masih loading atau jam kerja masih berlaku
  if (loading || !isOutsideBusinessHours) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Di Luar Jam Operasional</h2>
        </div>
        
        <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
            <p className="text-gray-700">{message}</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-md p-3 mb-4 text-left">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <Button 
            variant="outline"
            onClick={checkBusinessHours}
            className="w-full flex items-center justify-center"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? 'Memuat...' : 'Periksa Kembali'}
          </Button>
          
          <Button 
            variant="default"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Muat Ulang Halaman
          </Button>
          
          <div className="text-xs text-muted-foreground mt-2">
            Terakhir diperiksa: {lastChecked} ({checkCount}x)
          </div>
        </div>
      </div>
    </div>
  );
}
