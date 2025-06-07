/**
 * Format nomor telepon untuk WhatsApp (memastikan diawali dengan 62 untuk Indonesia)
 * - Menghapus semua karakter non-angka dari nomor telepon
 * - Mengubah awalan 0 menjadi 62
 * - Memastikan nomor diawali dengan 62
 * @param phoneNumber nomor telepon yang akan diformat
 * @returns nomor telepon yang telah diformat untuk WhatsApp
 */
export const formatPhoneNumberForWhatsApp = (phoneNumber: string): string => {
  // Hapus semua spasi, tanda hubung, atau karakter non-digit
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Jika nomor diawali dengan 0, ganti dengan 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // Jika nomor belum diawali dengan 62, tambahkan
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
};

/**
 * Format nomor telepon untuk tampilan UI
 * @param phoneNumber nomor telepon yang akan diformat
 * @returns nomor telepon yang telah diformat untuk tampilan
 */
export const formatPhoneNumberForDisplay = (phoneNumber: string): string => {
  const formatted = formatPhoneNumberForWhatsApp(phoneNumber);
  
  // Format nomor Indonesia: 62xxx-xxxx-xxxx
  if (formatted.startsWith('62') && formatted.length >= 10) {
    // Ambil kode area dan nomor
    const areaCode = formatted.substring(0, 4); // 62xx
    const firstPart = formatted.substring(4, 8);
    const lastPart = formatted.substring(8);
    
    return `${areaCode}-${firstPart}-${lastPart}`;
  }
  
  return formatted;
};

/**
 * Format harga dalam format Rupiah (Rp)
 * @param amount jumlah yang akan diformat
 * @returns harga yang diformat dalam Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
