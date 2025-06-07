import { supabase } from "@/integrations/supabase/client";

// Definisi tipe data untuk jam kerja
export interface WorkingDay {
  day: string;
  isActive: boolean;
  openTime: string;
  closeTime: string;
}

export interface BusinessHoursSettings {
  isEnabled: boolean;
  workingDays: WorkingDay[];
  offWorkMessage: string;
}

export interface IBusinessHoursService {
  getBusinessHours: () => Promise<BusinessHoursSettings>;
  updateBusinessHours: (settings: BusinessHoursSettings) => Promise<{success: boolean, message: string}>;
  isWithinBusinessHours: (forceNow?: Date) => Promise<boolean>;
  getCurrentStatus: (forceNow?: Date) => Promise<{ isOpen: boolean; message: string }>;
  resetToDefault: () => Promise<{success: boolean, message: string}>;
}

const DEFAULT_BUSINESS_HOURS: BusinessHoursSettings = {
  isEnabled: false,
  workingDays: [
    { day: "monday", isActive: true, openTime: "08:00", closeTime: "17:00" },
    { day: "tuesday", isActive: true, openTime: "08:00", closeTime: "17:00" },
    { day: "wednesday", isActive: true, openTime: "08:00", closeTime: "17:00" },
    { day: "thursday", isActive: true, openTime: "08:00", closeTime: "17:00" },
    { day: "friday", isActive: true, openTime: "08:00", closeTime: "17:00" },
    { day: "saturday", isActive: true, openTime: "08:00", closeTime: "15:00" },
    { day: "sunday", isActive: false, openTime: "08:00", closeTime: "15:00" },
  ],
  offWorkMessage: "Maaf, kami sedang tutup. Silakan kembali pada jam operasional kami.",
};

class BusinessHoursService implements IBusinessHoursService {
  private settings: BusinessHoursSettings | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 menit
  private readonly LOCAL_STORAGE_KEY = "business_hours_settings";

  /**
   * Mengambil pengaturan jam kerja dengan prioritas:
   * 1. Cache memory
   * 2. Supabase (sumber data utama)
   * 3. LocalStorage (fallback)
   * 4. Default settings
   */
  public async getBusinessHours(): Promise<BusinessHoursSettings> {
    // Jika data sudah ada di cache dan masih valid, gunakan cache
    const now = Date.now();
    if (this.settings && (now - this.lastFetchTime < this.CACHE_DURATION_MS)) {
      console.debug("Menggunakan cache untuk pengaturan jam kerja");
      return this.settings;
    }

    // Prioritaskan data dari Supabase
    try {
      console.debug("Mengambil pengaturan jam kerja dari Supabase");
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "business_hours")
        .maybeSingle();

      if (error) {
        // Jika terjadi error, catat log dan gunakan fallback ke localStorage
        console.debug("Supabase error, coba gunakan localStorage:", error);
        const localSettings = this.getFromLocalStorage();
        if (localSettings) {
          this.settings = localSettings;
          this.lastFetchTime = now;
          return localSettings;
        }
        // Jika localStorage juga tidak ada, gunakan default
        this.settings = DEFAULT_BUSINESS_HOURS;
        this.lastFetchTime = now;
        return DEFAULT_BUSINESS_HOURS;
      }

      if (data && data.value) {
        // Data ditemukan di Supabase
        const settings = data.value as BusinessHoursSettings;
        this.settings = settings;
        this.lastFetchTime = now;
        
        // Simpan ke localStorage untuk digunakan saat offline atau error
        this.saveToLocalStorage(settings);
        
        return settings;
      }

      // Tidak ada data di Supabase, gunakan default
      this.settings = DEFAULT_BUSINESS_HOURS;
      this.lastFetchTime = now;
      return DEFAULT_BUSINESS_HOURS;
    } catch (error) {
      // Error yang tidak ditangkap (koneksi, dll)
      console.debug("Error fetching from Supabase, using default settings");
      this.settings = DEFAULT_BUSINESS_HOURS;
      this.lastFetchTime = now;
      return DEFAULT_BUSINESS_HOURS;
    }
  }

  /**
   * Memperbarui pengaturan jam kerja
   * Menyimpan ke database Supabase sebagai sumber data utama
   * @returns Promise dengan object hasil operasi {success: boolean, message: string}
   */
  public async updateBusinessHours(settings: BusinessHoursSettings): Promise<{success: boolean, message: string}> {
    try {
      console.debug("Menyimpan pengaturan jam kerja ke Supabase");
      // Simpan ke Supabase sebagai sumber data utama
      const { error } = await supabase
        .from("settings")
        .upsert(
          { 
            key: "business_hours", 
            value: settings,
            updated_at: new Date().toISOString()
          },
          { onConflict: "key" }
        );

      if (error) {
        console.error("Error updating business hours in Supabase:", error);
        // Jika database gagal, simpan ke localStorage sebagai fallback
        this.saveToLocalStorage(settings);
        return {
          success: false,
          message: `Gagal menyimpan ke database: ${error.message}. Data disimpan lokal sebagai cadangan.`
        };
      }
      
      // Jika berhasil, perbarui cache dan simpan juga ke localStorage
      this.settings = settings;
      this.lastFetchTime = Date.now();
      this.saveToLocalStorage(settings);
      
      console.debug("Business hours saved to Supabase successfully");
      return {
        success: true,
        message: "Pengaturan jam kerja berhasil disimpan ke database."
      };
    } catch (error) {
      console.error("Exception updating business hours:", error);
      // Simpan ke localStorage sebagai fallback
      this.saveToLocalStorage(settings);
      this.settings = settings;
      this.lastFetchTime = Date.now();
      
      return {
        success: false,
        message: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}. Data disimpan lokal.`
      };
    }
  }

  /**
   * Memeriksa apakah waktu saat ini berada dalam jam kerja
   * @param forceNow Optional parameter untuk testing, memaksa waktu tertentu
   */
  public async isWithinBusinessHours(forceNow?: Date): Promise<boolean> {
    const settings = await this.getBusinessHours();
    
    // Jika fitur jam kerja dinonaktifkan, selalu kembalikan true
    if (!settings || !settings.isEnabled) {
      console.debug("Jam kerja dinonaktifkan, status: BUKA");
      return true;
    }

    // Definisikan daftar hari dalam seminggu
    const currentDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    
    // Dapatkan hari dan waktu saat ini dengan timezone Indonesia (WIB/GMT+7)
    const now = forceNow || new Date();
    
    // Format tanggal dalam timezone Indonesia
    const jakartaTime = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(now);
    
    console.debug(`Waktu Jakarta (WIB): ${jakartaTime}`);
    
    // Konversi ke hari dalam bahasa Inggris untuk kompatibilitas
    const dayMapping: Record<string, string> = {
      'Minggu': 'sunday',
      'Senin': 'monday',
      'Selasa': 'tuesday',
      'Rabu': 'wednesday',
      'Kamis': 'thursday',
      'Jumat': 'friday',
      'Sabtu': 'saturday'
    };
    
    // Ekstrak hari dari format Indonesia
    const indonesianDay = jakartaTime.split(',')[0];
    const currentDay = dayMapping[indonesianDay] || currentDays[now.getDay()];
    
    // Ekstrak jam dan menit dari waktu yang diformat
    const timeMatch = jakartaTime.match(/(\d{1,2})\.(\d{2})/);
    let currentHour = now.getHours();
    let currentMinute = now.getMinutes();
    
    if (timeMatch && timeMatch.length >= 3) {
      currentHour = parseInt(timeMatch[1], 10);
      currentMinute = parseInt(timeMatch[2], 10);
    }
    
    // Fallback ke metode konvensional jika ekstraksi gagal
    if (isNaN(currentHour) || isNaN(currentMinute)) {
      // Sesuaikan waktu untuk WIB (GMT+7)
      const currentUTCHour = now.getUTCHours();
      currentHour = (currentUTCHour + 7) % 24;
      currentMinute = now.getUTCMinutes();
    }
    
    // Log waktu saat ini untuk debugging
    console.debug(`Waktu saat ini: ${currentDay} ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    // Cari pengaturan untuk hari ini
    const todaySetting = settings.workingDays.find(
      (day) => day.day === currentDay
    );

    // Jika hari ini tidak aktif, toko tutup
    if (!todaySetting || !todaySetting.isActive) {
      console.debug(`Hari ${currentDay} tidak aktif, status: TUTUP`);
      return false;
    }

    // Parsing jam buka dan tutup
    const [openHour, openMinute] = todaySetting.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = todaySetting.closeTime.split(":").map(Number);

    // Konversi waktu saat ini, buka, dan tutup ke menit
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;

    // Log semua waktu dalam menit untuk debugging
    console.debug(`Jam buka: ${openHour}:${openMinute.toString().padStart(2, '0')} (${openTimeInMinutes} menit)`);
    console.debug(`Jam tutup: ${closeHour}:${closeMinute.toString().padStart(2, '0')} (${closeTimeInMinutes} menit)`);
    console.debug(`Waktu saat ini: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} menit)`);

    let isOpen = false;
    
    // Jika jam tutup lebih awal dari jam buka, berarti melewati tengah malam
    // Contoh: Buka 20:00, Tutup 02:00
    if (closeTimeInMinutes < openTimeInMinutes) {
      // Jika sekarang setelah jam buka atau sebelum jam tutup (lewat tengah malam)
      isOpen = currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes;
      console.debug(`Mode operasi: MELEWATI TENGAH MALAM, status: ${isOpen ? 'BUKA' : 'TUTUP'}`);
    } else {
      // Kasus normal: jam buka sampai jam tutup dalam hari yang sama
      isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
      console.debug(`Mode operasi: NORMAL, status: ${isOpen ? 'BUKA' : 'TUTUP'}`);
    }

    return isOpen;
  }

  /**
   * Mendapatkan status toko saat ini (buka/tutup) dan pesan yang sesuai
   * @param forceNow Optional parameter untuk testing, memaksa waktu tertentu
   */
  public async getCurrentStatus(forceNow?: Date): Promise<{ isOpen: boolean; message: string }> {
    try {
      const settings = await this.getBusinessHours();
      
      if (!settings || !settings.isEnabled) {
        return { 
          isOpen: true, 
          message: "" 
        };
      }

      const isOpen = await this.isWithinBusinessHours(forceNow);
      
      if (isOpen) {
        return { 
          isOpen: true, 
          message: "" 
        };
      } else {
        // Mendapatkan informasi hari kerja untuk pesan yang lebih informatif
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const currentDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const daysInIndonesian = {
          "sunday": "Minggu",
          "monday": "Senin",
          "tuesday": "Selasa",
          "wednesday": "Rabu",
          "thursday": "Kamis",
          "friday": "Jumat",
          "saturday": "Sabtu"
        };
        
        const currentDay = currentDays[now.getDay()];
        const tomorrowDay = currentDays[tomorrow.getDay()];
        
        const todaySetting = settings.workingDays.find(day => day.day === currentDay);
        const tomorrowSetting = settings.workingDays.find(day => day.day === tomorrowDay);
        
        let message = settings.offWorkMessage;
        
        // Tambahkan informasi kapan buka kembali jika tersedia
        if (todaySetting && todaySetting.isActive) {
          // Jika hari ini aktif tapi di luar jam, mungkin sebelum buka
          const [openHour, openMinute] = todaySetting.openTime.split(":").map(Number);
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          const currentTimeInMinutes = currentHour * 60 + currentMinute;
          const openTimeInMinutes = openHour * 60 + openMinute;
          
          if (currentTimeInMinutes < openTimeInMinutes) {
            message += ` Kami akan buka hari ini pukul ${this.formatTimeIndonesia(todaySetting.openTime)}.`;
          }
        } else if (tomorrowSetting && tomorrowSetting.isActive) {
          // Jika besok aktif
          message += ` Kami akan buka besok (${daysInIndonesian[tomorrowDay]}) pukul ${this.formatTimeIndonesia(tomorrowSetting.openTime)}.`;
        } else {
          let nextOpenDay = this.findNextOpenDay(settings.workingDays, currentDays.indexOf(currentDay));
          if (nextOpenDay) {
            const indonesianDay = this.getIndonesianDayName(nextOpenDay.day);
            const formattedTime = this.formatTimeIndonesia(nextOpenDay.openTime);
            message += ` Kami akan buka kembali pada hari ${indonesianDay} pukul ${formattedTime} WIB.`;
          }
        }
        
        return { 
          isOpen: false, 
          message: message 
        };
      }
    } catch (error) {
      // Tangani error dengan diam, kembalikan toko selalu buka
      console.debug("Error getting current status, defaulting to open", error);
      return {
        isOpen: true,
        message: ""
      };
    }
  }

  /**
   * Fungsi utilitas untuk mendapatkan format waktu Indonesia
   */
  private formatTimeIndonesia(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Mendapatkan nama hari dalam bahasa Indonesia
   */
  private getIndonesianDayName(englishDay: string): string {
    const dayMapping: Record<string, string> = {
      'sunday': 'Minggu',
      'monday': 'Senin',
      'tuesday': 'Selasa',
      'wednesday': 'Rabu',
      'thursday': 'Kamis',
      'friday': 'Jumat',
      'saturday': 'Sabtu'
    };
    
    return dayMapping[englishDay] || englishDay;
  }

  /**
   * Mencari hari kerja berikutnya yang aktif
   */
  private findNextOpenDay(workingDays: { day: string; isActive: boolean; openTime: string; closeTime: string }[], startIndex: number): { day: string; openTime: string } | null {
    for (let i = startIndex + 1; i < workingDays.length + startIndex; i++) {
      const dayIndex = i % workingDays.length;
      if (workingDays[dayIndex].isActive) {
        return workingDays[dayIndex];
      }
    }
    return null;
  }

  /**
   * Menyimpan pengaturan ke localStorage
   */
  private saveToLocalStorage(settings: BusinessHoursSettings): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(settings));
      console.debug("Pengaturan jam kerja disimpan ke localStorage");
    } catch (error) {
      console.debug("Error saving business hours to localStorage:", error);
    }
  }

  /**
   * Mendapatkan pengaturan dari localStorage
   */
  private getFromLocalStorage(): BusinessHoursSettings | null {
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data) as BusinessHoursSettings;
        console.debug("Berhasil mengambil pengaturan jam kerja dari localStorage");
        return parsedData;
      }
      console.debug("Tidak ada data jam kerja di localStorage");
      return null;
    } catch (error) {
      console.debug("Error reading business hours from localStorage:", error);
      return null;
    }
  }
  
  /**
   * Reset pengaturan jam kerja ke default dan simpan ke database
   * @returns Promise dengan object hasil operasi {success: boolean, message: string}
   */
  public async resetToDefault(): Promise<{success: boolean, message: string}> {
    try {
      console.debug("Reset pengaturan jam kerja ke default");
      return await this.updateBusinessHours(DEFAULT_BUSINESS_HOURS);
    } catch (error) {
      console.error("Error resetting business hours:", error);
      return {
        success: false,
        message: `Gagal reset pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const businessHoursService = new BusinessHoursService();