import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/Icons";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState("identity");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identityImage, setIdentityImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Identity verification form data
  const [formData, setFormData] = useState({
    nik: "",
    fullName: "",
    birthPlace: "",
    birthDate: "",
    gender: "",
    address: "",
    rt: "",
    rw: "",
    village: "",
    district: "",
    city: "",
    province: "",
    religion: "",
    maritalStatus: "",
    occupation: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIdentityUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      
      // Simulate file upload delay
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            setIdentityImage(event.target.result as string);
          }
        };
        reader.readAsDataURL(e.target.files[0]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      
      // Simulate file upload delay
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            setSelfieImage(event.target.result as string);
          }
        };
        reader.readAsDataURL(e.target.files[0]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call for verification submission
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/ppob");
      
      // Would show success notification here in a real app
    }, 2000);
  };

  return (
    <Layout>
      <Helmet>
        <title>Verifikasi Identitas - JPC Digi</title>
        <meta name="description" content="Verifikasi identitas untuk menggunakan layanan PPOB JPC Digi" />
      </Helmet>

      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Verifikasi Identitas</h1>
              <p className="text-muted-foreground">
                Verifikasi identitas Anda untuk menggunakan layanan PPOB secara lengkap
              </p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                onClick={() => navigate("/ppob/wallet")}
              >
                <Icons.wallet className="mr-2 h-4 w-4" />
                Wallet Saya
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/ppob")}
              >
                Kembali ke PPOB
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lengkapi Verifikasi</CardTitle>
              <CardDescription>
                Verifikasi identitas sesuai dengan regulasi untuk keamanan transaksi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="identity">Data Diri</TabsTrigger>
                  <TabsTrigger value="documents">Dokumen</TabsTrigger>
                </TabsList>

                <TabsContent value="identity">
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nik">Nomor KTP (NIK)</Label>
                        <Input
                          id="nik"
                          name="nik"
                          placeholder="Masukkan 16 digit NIK"
                          value={formData.nik}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="Sesuai KTP"
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthPlace">Tempat Lahir</Label>
                        <Input
                          id="birthPlace"
                          name="birthPlace"
                          placeholder="Kota kelahiran"
                          value={formData.birthPlace}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Tanggal Lahir</Label>
                        <Input
                          id="birthDate"
                          name="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Alamat</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Alamat lengkap sesuai KTP"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rt">RT</Label>
                        <Input
                          id="rt"
                          name="rt"
                          placeholder="RT"
                          value={formData.rt}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rw">RW</Label>
                        <Input
                          id="rw"
                          name="rw"
                          placeholder="RW"
                          value={formData.rw}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="village">Kelurahan/Desa</Label>
                        <Input
                          id="village"
                          name="village"
                          placeholder="Kelurahan/Desa"
                          value={formData.village}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">Kecamatan</Label>
                        <Input
                          id="district"
                          name="district"
                          placeholder="Kecamatan"
                          value={formData.district}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Kota/Kabupaten</Label>
                        <Input
                          id="city"
                          name="city"
                          placeholder="Kota/Kabupaten"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Provinsi</Label>
                        <Input
                          id="province"
                          name="province"
                          placeholder="Provinsi"
                          value={formData.province}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab("documents")}
                    >
                      Lanjutkan
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="documents">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Foto KTP</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Unggah foto KTP yang jelas dan tidak terpotong
                        </p>

                        {identityImage ? (
                          <div className="relative">
                            <img 
                              src={identityImage} 
                              alt="KTP" 
                              className="w-full max-h-60 object-contain border rounded-md" 
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setIdentityImage(null)}
                            >
                              Ganti
                            </Button>
                          </div>
                        ) : (
                          <div className="border border-dashed rounded-md p-8 text-center">
                            <input
                              type="file"
                              id="identity-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleIdentityUpload}
                              disabled={isUploading}
                            />
                            <label 
                              htmlFor="identity-upload" 
                              className="cursor-pointer block"
                            >
                              {isUploading ? (
                                <div className="flex flex-col items-center">
                                  <Icons.spinner className="h-8 w-8 animate-spin text-primary mb-2" />
                                  <p>Mengunggah...</p>
                                </div>
                              ) : (
                                <>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-10 w-10 mx-auto text-muted-foreground mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                    />
                                  </svg>
                                  <p>Klik untuk mengunggah foto KTP</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Format: JPG, PNG, maksimal 5MB
                                  </p>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>

                      <Separator className="my-6" />

                      <div>
                        <h3 className="text-lg font-medium mb-2">Foto Selfie dengan KTP</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Unggah foto diri Anda sambil memegang KTP
                        </p>

                        {selfieImage ? (
                          <div className="relative">
                            <img 
                              src={selfieImage} 
                              alt="Selfie dengan KTP" 
                              className="w-full max-h-60 object-contain border rounded-md" 
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setSelfieImage(null)}
                            >
                              Ganti
                            </Button>
                          </div>
                        ) : (
                          <div className="border border-dashed rounded-md p-8 text-center">
                            <input
                              type="file"
                              id="selfie-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleSelfieUpload}
                              disabled={isUploading}
                            />
                            <label 
                              htmlFor="selfie-upload" 
                              className="cursor-pointer block"
                            >
                              {isUploading ? (
                                <div className="flex flex-col items-center">
                                  <Icons.spinner className="h-8 w-8 animate-spin text-primary mb-2" />
                                  <p>Mengunggah...</p>
                                </div>
                              ) : (
                                <>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-10 w-10 mx-auto text-muted-foreground mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                                    />
                                  </svg>
                                  <p>Klik untuk mengunggah foto selfie dengan KTP</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Format: JPG, PNG, maksimal 5MB
                                  </p>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setActiveTab("identity")}
                      >
                        Kembali
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!identityImage || !selfieImage || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          "Kirim Verifikasi"
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col text-xs text-muted-foreground border-t pt-4">
              <p>Data yang dikirimkan akan digunakan untuk keperluan verifikasi identitas sesuai regulasi.</p>
              <p>JPC Digi menjamin keamanan dan kerahasiaan data pribadi Anda.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
