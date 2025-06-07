
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const AddressPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNewAddress = id === "new";

  // Address form state
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch address data if editing
  useEffect(() => {
    const fetchAddress = async () => {
      if (isNewAddress || !user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setName(data.name);
          setStreet(data.street);
          setCity(data.city);
          setState(data.state);
          setZip(data.zip);
          setCountry(data.country);
          setIsDefault(data.is_default);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Tidak dapat memuat detail alamat",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAddress();
  }, [id, user, isNewAddress, toast]);
  
  // Handle save address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Anda harus login untuk menyimpan alamat",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // If this is set as default, update all other addresses to not be default
      if (isDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }
      
      // Create the address object
      const addressData = {
        name,
        street,
        city,
        state,
        zip,
        country,
        is_default: isDefault,
        user_id: user.id
      };
      
      if (isNewAddress) {
        // Insert new address
        const { error } = await supabase
          .from("addresses")
          .insert([addressData]);
          
        if (error) throw error;
        
        toast({
          title: "Alamat Ditambahkan",
          description: "Alamat Anda telah berhasil disimpan"
        });
      } else {
        // Update existing address
        const { error } = await supabase
          .from("addresses")
          .update(addressData)
          .eq("id", id)
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        toast({
          title: "Alamat Diperbarui",
          description: "Alamat Anda telah berhasil diperbarui"
        });
      }
      
      // Navigate back to profile page
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Tidak dapat menyimpan alamat",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!user || isNewAddress || !id || id === 'undefined') {
      toast({
        title: "Konfirmasi penghapusan",
        description: "Apakah Anda yakin ingin menghapus alamat ini?",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      toast({
        title: "Alamat Dihapus",
        description: "Alamat Anda telah berhasil dihapus"
      });
      
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Tidak dapat menghapus alamat",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate("/profile")}
            className="text-charcoal-600 flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Kembali</span>
          </button>
          <h1 className="text-xl font-bold text-center flex-1 pr-6">
            {isNewAddress ? "Tambah Alamat Baru" : "Edit Alamat"}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Alamat</Label>
            <Input 
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rumah, Kantor, dll."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="street">Alamat Jalan</Label>
            <Input 
              id="street"
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Jl. Contoh No. 123"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">Kota</Label>
            <Input 
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Nama Kota"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">Provinsi</Label>
            <Input 
              id="state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Nama Provinsi"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zip">Kode Pos</Label>
            <Input 
              id="zip"
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Kode Pos"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Catatan Detail Lokasi</Label>
            <Input 
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Ceritakan Detail Lokasi Agar Lebih Mudah Ditemukan"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isDefault" 
              checked={isDefault} 
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="isDefault">Jadikan alamat utama</Label>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-flame-500 hover:bg-flame-600"
              disabled={isLoading}
            >
              {isLoading ? "Menyimpan..." : "Simpan Alamat"}
            </Button>
          </div>
          
          {!isNewAddress && (
            <div className="pt-2">
              <Button 
                type="button"
                variant="outline"
                className="w-full text-destructive border-destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Hapus Alamat
              </Button>
            </div>
          )}
        </form>
      </div>
    </MobileLayout>
  );
};

export default AddressPage;
