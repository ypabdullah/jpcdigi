
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { formatPhoneNumberForWhatsApp } from "@/utils/format";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama harus minimal 2 karakter" }),
  email: z.string().email({ message: "Silakan masukkan alamat email yang valid" }),
  whatsapp: z
    .string()
    .min(10, { message: "Nomor WhatsApp tidak valid" })
    .max(15, { message: "Nomor WhatsApp tidak valid" })
    .regex(/^(62|0)[0-9]{9,13}$/, { 
      message: "Format nomor WhatsApp harus diawali 62/0 (contoh: 6281234567890 atau 081234567890)" 
    }),
  password: z.string().min(8, { message: "Kata sandi harus minimal 8 karakter" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Format nomor WhatsApp untuk memastikan diawali dengan 62
      const formattedWhatsapp = formatPhoneNumberForWhatsApp(data.whatsapp);
      
      // Gunakan fungsi register dari AuthContext yang sudah dibuat
      await register(data.name, data.email, data.password);
      
      // Setelah register berhasil, update profile dengan nomor WhatsApp
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw authError;
      }
      
      if (authData?.session?.user) {
        // Simpan nomor WhatsApp ke tabel profiles tanpa menggunakan updated_at sampai migrasi dijalankan
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone: formattedWhatsapp // Simpan dalam format 62xxx
          })
          .eq("id", authData.session.user.id);

        if (profileError) {
          console.error("Error saving WhatsApp number to profile:", profileError);
          toast({
            variant: "destructive",
            title: "Terjadi kesalahan",
            description: "Gagal menyimpan nomor WhatsApp. Silakan update di halaman profil.",
          });
        }
      }

      toast({
        title: "Pendaftaran berhasil",
        description: "Akun Anda telah dibuat. Silakan periksa email Anda untuk verifikasi akun.",
      });

      // Redirect to the login page
      navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Pendaftaran gagal",
        description: error.message || "Terjadi kesalahan saat pendaftaran.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Buat Akun</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Daftar untuk mulai menggunakan layanan kami
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama Anda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="namaemailkamu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor WhatsApp</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="6281234567890 atau 081234567890" 
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Format: Diawali dengan 62 atau 0, contoh: 6281234567890 atau 081234567890
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Kata Sandi</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-flame-500 hover:bg-flame-600"
              disabled={isLoading}
            >
              {isLoading ? "Mendaftar..." : "Daftar"}
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Sudah memiliki akun?{" "}
            <Link to="/login" className="text-flame-500 hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
