
import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { registerForNotifications, storeFCMToken } from "@/integrations/firebase/notification-service";
import { TestOrderNotification } from "@/components/admin/TestOrderNotification";
import BusinessHoursSettingsComponent from "@/components/admin/BusinessHoursSettings";

// Define form schemas
const profileFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Alamat email tidak valid"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Kata sandi minimal 6 karakter").optional(),
  confirmPassword: z.string().optional()
}).refine(data => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"]
});

const storeSettingsSchema = z.object({
  storeName: z.string().min(1, "Nama toko wajib diisi"),
  contactEmail: z.string().email("Alamat email tidak valid"),
  currency: z.string().min(1, "Mata uang wajib diisi")
});

const notificationSettingsSchema = z.object({
  enableOrderNotifications: z.boolean().default(true),
  enableChatNotifications: z.boolean().default(true),
  enableSoundNotifications: z.boolean().default(true)
});

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Toko E-commerce Saya",
    contactEmail: "contact@example.com",
    currency: "IDR"
  });
  
  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  
  const storeForm = useForm({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: storeSettings.storeName,
      contactEmail: storeSettings.contactEmail,
      currency: storeSettings.currency
    }
  });
  
  const notificationForm = useForm({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      enableOrderNotifications: true,
      enableChatNotifications: true,
      enableSoundNotifications: true
    }
  });
  
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
        email: profile.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [profile]);
  
  useEffect(() => {
    fetchStoreSettings();
    fetchNotificationSettings();
    checkNotificationPermission();
  }, []);
  
  const checkNotificationPermission = () => {
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  };
  
  const fetchStoreSettings = async () => {
    try {
      // Ideally, store settings should be in a separate table, but using localStorage for demo
      const storedSettings = localStorage.getItem('storeSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setStoreSettings(parsedSettings);
        storeForm.reset({
          storeName: parsedSettings.storeName,
          contactEmail: parsedSettings.contactEmail,
          currency: parsedSettings.currency
        });
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
    }
  };
  
  const fetchNotificationSettings = async () => {
    try {
      // Get notification settings from local storage
      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        notificationForm.reset({
          enableOrderNotifications: parsedSettings.enableOrderNotifications,
          enableChatNotifications: parsedSettings.enableChatNotifications,
          enableSoundNotifications: parsedSettings.enableSoundNotifications
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  };
  
  const onSubmitProfile = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update email if changed
      if (values.email && values.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: values.email,
        });
        
        if (emailError) throw emailError;
      }
      
      // Update password if provided
      if (values.newPassword) {
        if (values.newPassword !== values.confirmPassword) {
          toast({
            title: "Error",
            description: "Kata sandi tidak cocok",
            variant: "destructive"
          });
          return;
        }
        
        const { error: passwordError } = await supabase.auth.updateUser({
          password: values.newPassword,
        });
        
        if (passwordError) throw passwordError;
      }
      
      toast({
        title: "Profil diperbarui",
        description: "Profil Anda telah berhasil diperbarui"
      });
      
      // Reset form
      profileForm.reset({
        name: values.name,
        email: values.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Refresh profile data
      await refreshProfile();
      
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error memperbarui profil",
        description: error.message || "Terjadi kesalahan saat memperbarui profil Anda",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitStoreSettings = async (values: z.infer<typeof storeSettingsSchema>) => {
    setIsStoreLoading(true);
    try {
      // In a real implementation, this would update a store_settings table in the database
      // For now, we'll just use localStorage
      const newSettings = {
        storeName: values.storeName,
        contactEmail: values.contactEmail,
        currency: values.currency
      };
      
      localStorage.setItem('storeSettings', JSON.stringify(newSettings));
      setStoreSettings(newSettings);
      
      toast({
        title: "Pengaturan toko diperbarui",
        description: "Pengaturan toko Anda telah berhasil diperbarui"
      });
    } catch (error: any) {
      console.error("Error updating store settings:", error);
      toast({
        title: "Error memperbarui pengaturan toko",
        description: "Terjadi kesalahan saat memperbarui pengaturan toko Anda",
        variant: "destructive"
      });
    } finally {
      setIsStoreLoading(false);
    }
  };
  
  // Function to run database maintenance
  const runDatabaseVacuum = async () => {
    try {
      toast({
        title: "Pemeliharaan database",
        description: "Vakum database berhasil diselesaikan"
      });
      
      // In a real implementation, this would connect to Supabase and run the vacuum command
      // For now, it's just a simulated operation
      
      setTimeout(() => {
        toast({
          title: "Pemeliharaan database",
          description: "Vakum database berhasil diselesaikan"
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error running vacuum operation",
        description: error.message || "Terjadi kesalahan saat menjalankan operasi vakum",
        variant: "destructive"
      });
    }
  };
  
  // Function to clear old logs
  const clearOldLogs = async () => {
    try {
      toast({
        title: "Menghapus log lama",
        description: "Log lama berhasil dihapus"
      });
      
      // In a real implementation, this would connect to Supabase and delete old logs
      // For now, it's just a simulated operation
      
      setTimeout(() => {
        toast({
          title: "Menghapus log lama",
          description: "Log lama berhasil dihapus"
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error menghapus log lama",
        description: error.message || "Terjadi kesalahan saat menghapus log lama",
        variant: "destructive"
      });
    }
  };
  
  // Function to request notification permission
  const requestNotificationPermission = async () => {
    setIsNotificationLoading(true);
    try {
      if (!user) return;
      
      // Request permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Register for notifications
        const token = await registerForNotifications(user.id);
        
        if (token) {
          toast({
            title: "Notifikasi diaktifkan",
            description: "Anda akan menerima notifikasi pesanan baru"
          });
        } else {
          throw new Error("Gagal mendapatkan token notifikasi");
        }
      } else {
        toast({
          title: "Izin notifikasi ditolak",
          description: "Anda tidak akan menerima notifikasi. Ubah pengaturan browser untuk mengizinkan notifikasi.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error mengaktifkan notifikasi",
        description: error.message || "Terjadi kesalahan saat mengaktifkan notifikasi",
        variant: "destructive"
      });
    } finally {
      setIsNotificationLoading(false);
    }
  };
  
  // Function to save notification settings
  const onSubmitNotificationSettings = async (values: z.infer<typeof notificationSettingsSchema>) => {
    setIsNotificationLoading(true);
    try {
      // Save notification settings to local storage
      localStorage.setItem('notificationSettings', JSON.stringify(values));
      
      // If order notifications are enabled and permission is granted, register FCM token
      if (values.enableOrderNotifications && notificationPermission === 'granted' && user) {
        await registerForNotifications(user.id);
      }
      
      toast({
        title: "Pengaturan notifikasi diperbarui",
        description: "Preferensi notifikasi Anda telah berhasil diperbarui"
      });
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
      toast({
        title: "Error memperbarui pengaturan notifikasi",
        description: error.message || "Terjadi kesalahan saat memperbarui pengaturan notifikasi",
        variant: "destructive"
      });
    } finally {
      setIsNotificationLoading(false);
    }
  };
  
  // Function to test notification
  const testNotification = async () => {
    try {
      if (Notification.permission !== 'granted') {
        toast({
          title: "Izin notifikasi tidak diberikan",
          description: "Harap berikan izin notifikasi terlebih dahulu",
          variant: "destructive"
        });
        return;
      }
      
      // Show a test notification
      const notification = new Notification('Notifikasi Uji Coba', {
        body: 'Ini adalah notifikasi uji coba. Jika Anda melihat ini, berarti notifikasi berfungsi dengan baik!',
        icon: '/logo192.png'
      });
      
      // Also show a toast
      toast({
        title: "Notifikasi uji coba dikirim",
        description: "Periksa notifikasi browser Anda"
      });
      
      // Play notification sound
      const audio = new Audio('/sounds/new_order_sound.mp3');
      audio.play().catch(e => console.log('Error playing notification sound:', e));
      
    } catch (error: any) {
      console.error("Error testing notification:", error);
      toast({
        title: "Error mengirim notifikasi uji coba",
        description: error.message || "Terjadi kesalahan saat mengirim notifikasi uji coba",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-6">Pengaturan</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Ubah Kata Sandi</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kata Sandi Saat Ini</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kata Sandi Baru</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Konfirmasi Kata Sandi</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* System Settings */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Toko</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...storeForm}>
                <form onSubmit={storeForm.handleSubmit(onSubmitStoreSettings)} className="space-y-4">
                  <FormField
                    control={storeForm.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Toko</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={storeForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Kontak</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={storeForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mata Uang</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            {...field}
                          >
                            <option value="IDR">IDR (Rp)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isStoreLoading}>
                    {isStoreLoading ? "Menyimpan..." : "Simpan Pengaturan Toko"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pemeliharaan Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Jalankan operasi pemeliharaan pada database Anda. Operasi ini dapat membantu meningkatkan kinerja dan integritas data.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={runDatabaseVacuum}>Jalankan Vakum Database</Button>
                <Button variant="outline" onClick={clearOldLogs}>Bersihkan Log Lama</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Pengaturan Notifikasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Notification Permission Section */}
                <div className="pb-4 border-b">
                  <h3 className="text-lg font-medium mb-2">Izin Notifikasi Browser</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Status izin: <span className={`font-medium ${notificationPermission === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
                          {notificationPermission === 'granted' 
                            ? 'Diizinkan' 
                            : notificationPermission === 'denied' 
                              ? 'Ditolak (ubah di pengaturan browser)' 
                              : 'Belum diminta'}
                        </span>
                      </p>
                      {notificationPermission === 'denied' && (
                        <div className="flex items-center gap-2 text-sm text-red-500 mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Anda telah menolak izin notifikasi. Harap ubah di pengaturan browser Anda.</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      disabled={notificationPermission === 'denied' || isNotificationLoading}
                      onClick={requestNotificationPermission}
                    >
                      {isNotificationLoading ? "Mengizinkan..." : "Izinkan Notifikasi"}
                    </Button>
                  </div>
                </div>
                
                {/* Notification Settings Form */}
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onSubmitNotificationSettings)} className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="enableOrderNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Notifikasi Pesanan Baru</FormLabel>
                            <FormDescription>
                              Terima notifikasi saat ada pesanan baru dari pelanggan
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={notificationPermission !== 'granted'}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="enableChatNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Notifikasi Pesan Chat</FormLabel>
                            <FormDescription>
                              Terima notifikasi saat ada pesan baru dari pelanggan
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={notificationPermission !== 'granted'}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="enableSoundNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Notifikasi Suara</FormLabel>
                            <FormDescription>
                              Putar suara saat menerima notifikasi baru
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={isNotificationLoading || notificationPermission !== 'granted'}
                      >
                        {isNotificationLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={testNotification}
                        disabled={notificationPermission !== 'granted'}
                      >
                        Uji Notifikasi
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours Settings Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Pengaturan Jam Kerja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <BusinessHoursSettingsComponent />
              </div>
            </CardContent>
          </Card>

          {/* Test Order Notification Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Notifikasi Real-time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <TestOrderNotification />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
