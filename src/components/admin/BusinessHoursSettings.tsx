import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Info, Trash, Plus, RefreshCw, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { businessHoursService, type BusinessHoursSettings, type WorkingDay } from "@/lib/services/business-hours-service";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Date: DateConstructor;
  }
  var Date: DateConstructor;
}

const daysOfWeekIndo = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

function BusinessHoursSettings() {
  const [settings, setSettings] = useState<BusinessHoursSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<{ isOpen: boolean; message: string } | null>(null);
  const [testTime, setTestTime] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Fungsi untuk mengambil data jam kerja dari database
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await businessHoursService.getBusinessHours();
      setSettings(data);
      setHasChanges(false);

      const status = await businessHoursService.getCurrentStatus();
      setCurrentStatus(status);
      
      // Format waktu terakhir diperbarui
      setLastUpdated(new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta'
      }));
      
    } catch (error) {
      console.error("Error fetching business hours:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data jam kerja",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mengambil data saat komponen dimuat
  useEffect(() => {
    fetchSettings();
    
    // Setup real-time subscription untuk perubahan pada tabel settings
    const channel = supabase
      .channel('business-hours-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'settings',
        filter: 'key=eq.business_hours'
      }, (payload) => {
        console.debug('Business hours diubah:', payload);
        // Refresh data jika ada perubahan dan tidak sedang dalam proses penyimpanan
        if (!saving && !hasChanges) {
          fetchSettings();
          toast({
            title: "Info",
            description: "Pengaturan jam kerja telah diperbarui oleh admin lain",
          });
        }
      })
      .subscribe();
      
    // Cleanup subscription saat komponen unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [saving, hasChanges]);

  const handleToggleEnabled = (enabled: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      isEnabled: enabled,
    });
    setHasChanges(true);
  };

  const handleToggleDay = (index: number, isActive: boolean) => {
    if (!settings) return;
    const updatedDays = [...settings.workingDays];
    updatedDays[index] = {
      ...updatedDays[index],
      isActive,
    };
    setSettings({
      ...settings,
      workingDays: updatedDays,
    });
    setHasChanges(true);
  };

  const handleTimeChange = (index: number, type: "openTime" | "closeTime", time: string) => {
    if (!settings) return;
    const updatedDays = [...settings.workingDays];
    updatedDays[index] = {
      ...updatedDays[index],
      [type]: time,
    };
    setSettings({
      ...settings,
      workingDays: updatedDays,
    });
    setHasChanges(true);
  };
  
  // Fungsi untuk memeriksa apakah jam buka lebih besar dari jam tutup (melewati tengah malam)
  const openTimeIsAfterCloseTime = (day: WorkingDay): boolean => {
    if (!day.openTime || !day.closeTime) return false;
    
    const [openHour, openMinute] = day.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = day.closeTime.split(":").map(Number);
    
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    return closeTimeInMinutes < openTimeInMinutes;
  };

  const handleMessageChange = (message: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      offWorkMessage: message,
    });
    setHasChanges(true);
  };
  
  const handleResetDefault = async () => {
    if (confirm("Anda yakin ingin mengembalikan pengaturan jam kerja ke default?")) {
      setResetting(true);
      try {
        const result = await businessHoursService.resetToDefault();
        if (result.success) {
          toast({
            title: "Berhasil",
            description: result.message,
          });
          await fetchSettings();
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error resetting business hours:", error);
        toast({
          title: "Error",
          description: "Gagal mereset pengaturan jam kerja",
          variant: "destructive",
        });
      } finally {
        setResetting(false);
      }
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await businessHoursService.updateBusinessHours(settings);
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: result.message,
        });

        // Update status setelah menyimpan perubahan
        const status = await businessHoursService.getCurrentStatus();
        setCurrentStatus(status);
        setHasChanges(false);
        setLastUpdated(new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Jakarta'
        }));
      } else {
        toast({
          title: "Warning",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving business hours:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan jam kerja: " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Pengaturan Jam Kerja
          </CardTitle>
          <CardDescription>Memuat data dari database...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Pengaturan Jam Kerja
          </div>
          {hasChanges && (
            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
              <AlertCircle className="h-3 w-3 mr-1" /> Belum Disimpan
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {lastUpdated ? `Terakhir diperbarui: ${lastUpdated}` : 'Data dari database Supabase'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status saat ini */}
          {currentStatus && (
            <div className="mb-4 p-3 rounded bg-gray-100 dark:bg-gray-800">
              <h3 className="text-sm font-medium mb-1">Status Saat Ini:</h3>
              <div className="flex items-center">
                <Badge
                  className={currentStatus.isOpen ? "bg-green-500" : "bg-red-500"}
                >
                  {currentStatus.isOpen ? "BUKA" : "TUTUP"}
                </Badge>
                <span className="ml-2 text-sm">{currentStatus.message}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchSettings}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
                </Button>
              </div>
            </div>
          )}
          {/* Pengaturan jam kerja */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="business-hours-toggle"
                checked={settings.isEnabled}
                onCheckedChange={handleToggleEnabled}
              />
              <Label htmlFor="business-hours-toggle" className="font-medium">
                Aktifkan sistem jam kerja
              </Label>
            </div>
            {/* Status indikator */}
            {currentStatus && (
              <Badge variant={currentStatus.isOpen ? "outline" : "destructive"} className="ml-auto">
                {currentStatus.isOpen ? "Buka" : "Tutup"}
              </Badge>
            )}
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-md p-4 mb-6">
            <div className="flex items-start text-sm text-slate-600">
              <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-1"><strong>Tentang Fitur Jam Kerja:</strong></p>
                <p>Saat aktif, sistem ini akan membatasi akses pelanggan ke aplikasi hanya pada jam operasional yang ditentukan.</p>
                <p>Di luar jam tersebut, pelanggan akan melihat pesan yang Anda tentukan dan tidak dapat mengakses aplikasi.</p>
                <p className="mt-1"><strong>Jam Operasional Melewati Tengah Malam:</strong> Jika toko Anda buka melewati tengah malam (misalnya 20:00 - 02:00), atur jam buka lebih besar dari jam tutup.</p>
              </div>
            </div>
          </div>
          {/* Pengaturan jam kerja per hari */}
          <div className="mb-6">
            <h3 className="font-medium mb-4">Jadwal Jam Kerja</h3>
            <div className="space-y-4">
              {settings.workingDays.map((day, index) => (
                <div key={day.day} className="flex items-center space-x-4 p-3 border rounded-md bg-white">
                  <div className="flex items-center space-x-2 w-28">
                    <Switch
                      id={`day-${day.day}`}
                      checked={day.isActive}
                      onCheckedChange={(checked) => handleToggleDay(index, checked)}
                    />
                    <Label htmlFor={`day-${day.day}`} className={!day.isActive ? "text-gray-400" : ""}>
                      {daysOfWeekIndo[day.day as keyof typeof daysOfWeekIndo]}
                    </Label>
                  </div>
                  <div className={`flex-1 flex items-center space-x-2 ${!day.isActive ? "opacity-50" : ""}`}>
                    <div className="flex items-center">
                      <Label htmlFor={`open-${day.day}`} className="mr-2 text-sm whitespace-nowrap">
                        Buka:
                      </Label>
                      <Input
                        id={`open-${day.day}`}
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleTimeChange(index, "openTime", e.target.value)}
                        disabled={!day.isActive}
                        className="w-28"
                        aria-label="Jam buka"
                      />
                    </div>
                    <div className="flex items-center">
                      <Label htmlFor={`close-${day.day}`} className="mx-2 text-sm whitespace-nowrap">
                        Tutup:
                      </Label>
                      <Input
                        id={`close-${day.day}`}
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleTimeChange(index, "closeTime", e.target.value)}
                        disabled={!day.isActive}
                        className="w-28"
                        aria-label="Jam tutup"
                      />
                      {day.isActive && openTimeIsAfterCloseTime(day) && (
                        <span className="text-xs text-amber-600 ml-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 inline" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Jam tutup lebih awal dari jam buka. Ini akan dianggap sebagai jam kerja yang melewati tengah malam.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Pesan saat di luar jam kerja */}
          <div className="mb-6">
            <Label htmlFor="off-work-message" className="font-medium block mb-2">
              Pesan Di Luar Jam Kerja
            </Label>
            <Textarea
              id="off-work-message"
              value={settings.offWorkMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="Masukkan pesan yang akan ditampilkan ketika aplikasi di luar jam kerja"
              className="min-h-[100px]"
            />
          </div>
          {/* Fitur pengujian jam kerja */}
          <div className="bg-slate-50 border border-slate-100 rounded-md p-4 mb-6">
            <h3 className="font-medium mb-2">Uji Pengaturan Jam Kerja</h3>
            <p className="text-sm text-slate-600 mb-3">
              Masukkan waktu untuk menguji apakah toko akan terbuka atau tertutup pada waktu tersebut.
            </p>
            <div className="flex items-center space-x-4">
              <Input
                type="time"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                className="w-40"
                placeholder="HH:MM"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  if (testTime && settings) {
                    // Simpan tanggal sekarang
                    const original = new Date();
                    
                    // Buat tanggal dengan waktu yang diuji
                    const [hours, minutes] = testTime.split(":").map(Number);
                    const testDate = new Date();
                    testDate.setHours(hours, minutes, 0);
                    
                    // Override Date.now untuk pengujian
                    const originalNow = Date.now;
                    Date.now = () => testDate.getTime();
                    
                    // Override new Date() untuk pengujian
                    const OriginalDate = Date;
                    // @ts-ignore - Ini adalah hack untuk pengujian
                    Date = class extends OriginalDate {
                      constructor() {
                        super();
                        if (arguments.length === 0) {
                          return testDate;
                        }
                        // @ts-ignore - Ini adalah hack untuk pengujian
                        return new OriginalDate(...(arguments as any));
                      }
                    } as DateConstructor;
                    
                    // Uji status
                    businessHoursService.getCurrentStatus().then(status => {
                      // Kembalikan fungsi asli
                      Date.now = originalNow;
                      // @ts-ignore - Ini adalah hack untuk pengujian
                      Date = OriginalDate;
                      
                      toast({
                        title: status.isOpen ? "Toko Terbuka" : "Toko Tertutup",
                        description: status.isOpen 
                          ? `Pada pukul ${testTime}, toko akan terbuka.` 
                          : `Pada pukul ${testTime}, toko akan tertutup. Pesan: ${status.message}`,
                        variant: status.isOpen ? "default" : "destructive"
                      });
                    });
                  } else {
                    toast({
                      title: "Waktu tidak valid",
                      description: "Masukkan waktu yang valid untuk pengujian",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Uji Waktu
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={resetting || saving}
              onClick={handleResetDefault}
              className="flex items-center"
            >
              {resetting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-1 border-2 border-gray-300 rounded-full"></div>
                  Reset...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset ke Default
                </>
              )}
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="secondary"
                disabled={!hasChanges || saving}
                onClick={fetchSettings}
              >
                Batalkan Perubahan
              </Button>
              <Button
                type="button"
                disabled={saving || !hasChanges}
                onClick={handleSave}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-1 border-2 border-white rounded-full"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Simpan ke Database
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 text-xs text-gray-500 flex justify-between items-center">
        <div>
          Data disimpan di tabel <code>settings</code> di Supabase
        </div>
        <div className="flex items-center">
          {hasChanges ? (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              <AlertCircle className="h-3 w-3 mr-1" /> Ada perubahan belum disimpan
            </Badge>
          ) : (
            <Badge variant="outline" className="text-green-500 border-green-500">
              <CheckCircle className="h-3 w-3 mr-1" /> Tersimpan
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BusinessHoursSettings;
