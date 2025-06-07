import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { MapPin, LogOut, Phone, User, Mail, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { type Address, type UserProfile as UserProfileType } from "@/data/models";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Login form for users not logged in
const LoginForm = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Akses Akun</h1>
        <p className="text-muted-foreground">Masuk untuk mengelola akun dan pesanan Anda</p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <Button 
          onClick={() => navigate('/login')} 
          className="w-full bg-flame-500 hover:bg-flame-600"
        >
          Masuk
        </Button>
        <Button 
          onClick={() => navigate('/register')} 
          variant="outline" 
          className="w-full"
        >
          Buat Akun
        </Button>
      </div>
    </div>
  );
};

// Schema for the profile form validation
const profileFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string()
    .regex(/^(\+?62|0)[0-9]{9,13}$/, "Harus nomor telepon Indonesia yang valid (dimulai dengan +62 atau 0)")
    .optional()
    .or(z.literal(''))
});

// Create a ProfileForm component
const ProfileForm = ({ profile, onUpdate, onCancel }: { 
  profile: UserProfileType, 
  onUpdate: (data: {name: string, phone?: string}) => Promise<void>,
  onCancel: () => void
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      phone: profile?.phone || ""
    }
  });
  
  const handleSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      setIsSubmitting(true);
      // Convert empty string to undefined for optional phone field
      const formattedData = {
        name: values.name, // This is guaranteed to be a string by the schema
        phone: values.phone === '' ? undefined : values.phone
      };
      
      await onUpdate(formattedData);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-md font-medium mb-4">Edit Profil</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Lengkap</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Masukkan nama lengkap" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Telepon</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="contoh: 081234567890" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex space-x-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-flame-500 hover:bg-flame-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Batal
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

// Extract UserProfile component for better organization
const UserProfileComponent = () => {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  
  // Fetch user's addresses
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        if (user) {
          // Fetch addresses
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (addressError) {
            console.error('Error fetching addresses:', addressError);
          } else {
            setAddresses(addressData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  // Handle profile update
  const handleProfileUpdate = async (data: {name: string, phone?: string}) => {
    try {
      if (!user) return;
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          variant: "destructive",
          title: "Gagal memperbarui profil",
          description: error.message,
        });
        return;
      }
      
      // Refresh the profile in the context
      await refreshProfile();
      
      toast({
        title: "Profil berhasil diperbarui",
        description: "Informasi profil Anda telah disimpan",
      });
      
      // Close edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error in profile update:', error);
      toast({
        variant: "destructive",
        title: "Terjadi kesalahan",
        description: "Gagal memperbarui profil. Silakan coba lagi.",
      });
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Berhasil keluar",
        description: "Anda telah keluar dari akun",
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Gagal keluar",
        description: "Terjadi kesalahan saat mencoba keluar. Silakan coba lagi.",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Tunggu Sebentar...</p>
      </div>
    );
  }
  
  return (
    <div className="pb-16">
      {/* Header dengan foto profil dan info dasar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Akun Saya</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Keluar
        </Button>
      </div>
      
      {/* Profile header with avatar and basic info */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex items-center">
          <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mr-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{profile?.name || 'Pengguna'}</h2>
            <p className="text-slate-500 text-sm flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {profile?.email}
            </p>
            {profile?.phone && (
              <p className="text-slate-500 text-sm flex items-center mt-1">
                <Phone className="h-3 w-3 mr-1" />
                {profile.phone}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Informasi Pribadi</TabsTrigger>
          <TabsTrigger value="addresses">Alamat Saya</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-4 space-y-4">
          {!isEditing ? (
            <div className="p-5 rounded-lg bg-white shadow-sm">
              <h3 className="text-md font-medium mb-4 flex items-center">
                <User className="h-4 w-4 mr-2 text-slate-500" />
                Informasi Pribadi
              </h3>
              
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Nama Lengkap</p>
                  <p className="font-medium">{profile?.name || '-'}</p>
                </div>
                
                <div className="pb-3 border-b border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    {profile?.email || '-'}
                  </p>
                </div>
                
                <div className="pb-3 border-b border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Nomor Telepon</p>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-slate-400" />
                    {profile?.phone || '-'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status Akun</p>
                  <p className="font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    Terverifikasi
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => setIsEditing(true)}
                variant="outline" 
                className="mt-6 w-full"
              >
                Edit Profil
              </Button>
            </div>
          ) : (
            <div className="p-5 rounded-lg bg-white shadow-sm">
              <ProfileForm 
                profile={profile} 
                onUpdate={handleProfileUpdate}
                onCancel={() => setIsEditing(false)} 
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="addresses" className="mt-4">
          {addresses.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 mb-2">Belum ada alamat tersimpan</p>
              <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">Tambahkan alamat untuk mempermudah proses checkout saat berbelanja</p>
              <Button 
                onClick={() => navigate('/address/new')} 
                className="bg-flame-500 hover:bg-flame-600"
              >
                Tambah Alamat
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Utama
                        </span>
                      )}
                    </div>
                    <Link 
                      to={`/address/${address.id}`} 
                      className="text-sm text-flame-600 hover:text-flame-500"
                    >
                      Ubah
                    </Link>
                  </div>
                  <p className="text-sm mt-1">{address.street}</p>
                  <p className="text-sm">{address.city}, {address.state} {address.zip}</p>
                </div>
              ))}
              
              <div className="flex justify-center mt-2">
                <Button
                  onClick={() => navigate('/address/new')}
                  variant="outline"
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Tambah Alamat Baru
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main Profile Page component
const ProfilePage = () => {
  const { user } = useAuth();
  
  return (
    <MobileLayout>
      <div className="p-4">
        {user ? <UserProfileComponent /> : <LoginForm />}
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
