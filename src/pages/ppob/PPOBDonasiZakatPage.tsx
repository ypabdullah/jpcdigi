import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";

// Donation/Zakat categories
interface Organization {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
}

interface DonationAmount {
  value: number;
  label: string;
}

const organizations: Organization[] = [
  { 
    id: "baznas", 
    name: "BAZNAS", 
    category: "zakat", 
    image: "https://via.placeholder.com/100x50?text=BAZNAS",
    description: "Badan Amil Zakat Nasional - Lembaga resmi pengelola zakat nasional"
  },
  { 
    id: "dompetdhuafa", 
    name: "Dompet Dhuafa", 
    category: "zakat", 
    image: "https://via.placeholder.com/100x50?text=DompetDhuafa",
    description: "Lembaga filantropi Islam yang berkhidmat mengangkat harkat sosial kemanusiaan"
  },
  { 
    id: "rumahzakat", 
    name: "Rumah Zakat", 
    category: "zakat", 
    image: "https://via.placeholder.com/100x50?text=RumahZakat",
    description: "Lembaga amil zakat yang memfokuskan pada pendidikan, kesehatan, ekonomi dan lingkungan"
  },
  { 
    id: "pmipusat", 
    name: "PMI Pusat", 
    category: "donasi", 
    image: "https://via.placeholder.com/100x50?text=PMI",
    description: "Palang Merah Indonesia - Organisasi kemanusiaan yang bergerak di bidang kesehatan"
  },
  { 
    id: "kitabisa", 
    name: "Kitabisa Foundation", 
    category: "donasi", 
    image: "https://via.placeholder.com/100x50?text=Kitabisa",
    description: "Yayasan yang memfasilitasi berbagai kegiatan sosial dan kemanusiaan"
  },
  { 
    id: "unicef", 
    name: "UNICEF Indonesia", 
    category: "donasi", 
    image: "https://via.placeholder.com/100x50?text=UNICEF",
    description: "Lembaga yang berfokus pada kesejahteraan anak-anak di Indonesia"
  }
];

const donationAmounts: DonationAmount[] = [
  { value: 10000, label: "Rp10.000" },
  { value: 25000, label: "Rp25.000" },
  { value: 50000, label: "Rp50.000" },
  { value: 100000, label: "Rp100.000" },
  { value: 250000, label: "Rp250.000" },
  { value: 500000, label: "Rp500.000" },
  { value: 1000000, label: "Rp1.000.000" }
];

const PPOBDonasiZakatPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("donasi");
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donorName, setDonorName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Select a specific amount
  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  // Handle custom amount
  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  // Get final amount
  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    return customAmount ? parseInt(customAmount, 10) : 0;
  };

  // Handle payment
  const handleDonation = () => {
    if (!selectedOrganization || (!selectedAmount && !customAmount) || getFinalAmount() < 10000) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `${activeTab === "zakat" ? "ZKT" : "DON"}-${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setSuccessDialog(true);
    }, 1500);
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate("/ppob/all-services")}
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Donasi & Zakat</h1>
            <p className="text-xs text-muted-foreground">Berbagi kebaikan dengan mudah</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tabs */}
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={(value) => {
              setActiveTab(value);
              setSelectedOrganization(null);
              setSelectedAmount(null);
              setCustomAmount("");
            }}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="donasi">Donasi</TabsTrigger>
                <TabsTrigger value="zakat">Zakat</TabsTrigger>
              </TabsList>

              <TabsContent value="donasi" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Icons.heart className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Donasi Kemanusiaan</h3>
                    <p className="text-xs text-muted-foreground">Berikan bantuan untuk sesama</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="zakat" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Icons.mosque className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Bayar Zakat</h3>
                    <p className="text-xs text-muted-foreground">Tunaikan kewajiban zakat Anda</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Organization Selection */}
        {!selectedOrganization ? (
          <Card>
            <CardContent className="p-4">
              <Label className="text-base font-medium mb-3 block">
                Pilih Lembaga {activeTab === "zakat" ? "Zakat" : "Donasi"}
              </Label>
              <div className="space-y-3">
                {organizations
                  .filter(org => org.category === activeTab)
                  .map((org) => (
                    <div
                      key={org.id}
                      className="border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                      onClick={() => setSelectedOrganization(org)}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={org.image} 
                          alt={org.name} 
                          className="h-10 w-20 object-contain rounded"
                        />
                        <div>
                          <div className="font-medium text-sm">{org.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {org.description}
                          </div>
                        </div>
                      </div>
                      <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Selected Organization */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-medium">
                    {activeTab === "zakat" ? "Bayar Zakat ke:" : "Donasi ke:"}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrganization(null)}
                  >
                    Ganti
                  </Button>
                </div>

                <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                  <img 
                    src={selectedOrganization.image} 
                    alt={selectedOrganization.name} 
                    className="h-10 w-20 object-contain rounded"
                  />
                  <div>
                    <div className="font-medium">{selectedOrganization.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedOrganization.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <Card>
              <CardContent className="p-4">
                <Label className="text-base font-medium mb-3 block">
                  Pilih Nominal
                </Label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {donationAmounts.map((amount) => (
                    <Button
                      key={amount.value}
                      variant={selectedAmount === amount.value ? "default" : "outline"}
                      className={`h-12 ${selectedAmount === amount.value ? 'border-primary' : ''}`}
                      onClick={() => handleSelectAmount(amount.value)}
                    >
                      {amount.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Nominal Lainnya</Label>
                  <div className="relative">
                    <Input
                      className="h-12 pl-12 text-lg"
                      type="text"
                      inputMode="numeric"
                      value={customAmount}
                      onChange={handleCustomAmount}
                      placeholder="Minimal Rp10.000"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-500 font-medium">Rp</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donor Information */}
            <Card>
              <CardContent className="p-4">
                <Label className="text-base font-medium mb-3 block">
                  Informasi {activeTab === "zakat" ? "Muzakki" : "Donatur"}
                </Label>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="donorName">
                      Nama {activeTab === "zakat" ? "Muzakki" : "Donatur"}
                    </Label>
                    <Input
                      id="donorName"
                      className="h-12 mt-1"
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder={`Masukkan nama ${activeTab === "zakat" ? "muzakki" : "donatur"}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Opsional, kosongkan jika ingin {activeTab === "zakat" ? "berzakat" : "berdonasi"} secara anonim
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <div className="pt-2">
              <Button
                className="w-full"
                size="lg"
                disabled={isProcessing || getFinalAmount() < 10000}
                onClick={handleDonation}
              >
                {isProcessing ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  `${activeTab === "zakat" ? "Bayar Zakat" : "Donasi"} ${formatRupiah(getFinalAmount())}`
                )}
              </Button>
              {getFinalAmount() < 10000 && getFinalAmount() > 0 && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Minimal {activeTab === "zakat" ? "zakat" : "donasi"} adalah Rp10.000
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {activeTab === "zakat" ? "Zakat Berhasil Ditunaikan!" : "Donasi Berhasil!"}
            </DialogTitle>
            <DialogDescription className="text-center">
              Terima kasih atas {activeTab === "zakat" ? "zakat" : "donasi"} yang telah diberikan kepada {selectedOrganization?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Icons.check className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jenis</span>
                <span className="font-semibold">
                  {activeTab === "zakat" ? "Zakat" : "Donasi"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lembaga</span>
                <span className="font-semibold">{selectedOrganization?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {activeTab === "zakat" ? "Muzakki" : "Donatur"}
                </span>
                <span className="font-semibold">
                  {donorName || "Anonim"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-amber-500">
                  {formatRupiah(getFinalAmount())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Transaksi</span>
                <span className="font-semibold">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-semibold">
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigate("/ppob/all-services");
              }}
            >
              Kembali ke Layanan
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setSuccessDialog(false);
                setSelectedOrganization(null);
                setSelectedAmount(null);
                setCustomAmount("");
                setDonorName("");
              }}
            >
              Donasi Lagi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBDonasiZakatPage;
