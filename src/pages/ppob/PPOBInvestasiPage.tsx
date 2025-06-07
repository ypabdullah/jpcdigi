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
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Investment product types
const investmentTypes = [
  { id: "deposito", name: "Deposito", icon: "wallet", color: "bg-cyan-100", iconColor: "text-cyan-500" },
  { id: "emas", name: "Emas Digital", icon: "creditCard", color: "bg-amber-100", iconColor: "text-amber-500" },
  { id: "reksadana", name: "Reksa Dana", icon: "barChart", color: "bg-indigo-100", iconColor: "text-indigo-500" }
];

// Investment product options
const investmentProducts = [
  // Deposito products
  { 
    id: "deposito-1", 
    type: "deposito",
    name: "Deposito 1 Bulan", 
    interestRate: "3.25%",
    minAmount: 1000000,
    tenor: "1 bulan",
    description: "Penempatan dana dengan jangka waktu 1 bulan"
  },
  { 
    id: "deposito-3", 
    type: "deposito",
    name: "Deposito 3 Bulan", 
    interestRate: "3.75%",
    minAmount: 1000000,
    tenor: "3 bulan",
    description: "Penempatan dana dengan jangka waktu 3 bulan"
  },
  { 
    id: "deposito-6", 
    type: "deposito",
    name: "Deposito 6 Bulan", 
    interestRate: "4.50%",
    minAmount: 1000000,
    tenor: "6 bulan",
    description: "Penempatan dana dengan jangka waktu 6 bulan"
  },
  { 
    id: "deposito-12", 
    type: "deposito",
    name: "Deposito 12 Bulan", 
    interestRate: "5.00%",
    minAmount: 1000000,
    tenor: "12 bulan",
    description: "Penempatan dana dengan jangka waktu 12 bulan"
  },
  
  // Emas products
  { 
    id: "emas-0.5", 
    type: "emas",
    name: "Emas 0.5 gram", 
    interestRate: null,
    minAmount: 500000,
    tenor: null,
    description: "Investasi emas digital seberat 0.5 gram"
  },
  { 
    id: "emas-1", 
    type: "emas",
    name: "Emas 1 gram", 
    interestRate: null,
    minAmount: 1000000,
    tenor: null,
    description: "Investasi emas digital seberat 1 gram"
  },
  { 
    id: "emas-5", 
    type: "emas",
    name: "Emas 5 gram", 
    interestRate: null,
    minAmount: 5000000,
    tenor: null,
    description: "Investasi emas digital seberat 5 gram"
  },
  { 
    id: "emas-10", 
    type: "emas",
    name: "Emas 10 gram", 
    interestRate: null,
    minAmount: 10000000,
    tenor: null,
    description: "Investasi emas digital seberat 10 gram"
  },
  
  // Reksadana products
  { 
    id: "reksadana-pasar-uang", 
    type: "reksadana",
    name: "Reksa Dana Pasar Uang", 
    interestRate: "5-7% p.a.",
    minAmount: 100000,
    tenor: null,
    description: "Reksa dana dengan instrumen pasar uang, risiko rendah"
  },
  { 
    id: "reksadana-pendapatan-tetap", 
    type: "reksadana",
    name: "Reksa Dana Pendapatan Tetap", 
    interestRate: "7-9% p.a.",
    minAmount: 100000,
    tenor: null,
    description: "Reksa dana dengan instrumen obligasi, risiko sedang"
  },
  { 
    id: "reksadana-campuran", 
    type: "reksadana",
    name: "Reksa Dana Campuran", 
    interestRate: "8-12% p.a.",
    minAmount: 100000,
    tenor: null,
    description: "Reksa dana dengan instrumen campuran, risiko sedang"
  },
  { 
    id: "reksadana-saham", 
    type: "reksadana",
    name: "Reksa Dana Saham", 
    interestRate: "10-15% p.a.",
    minAmount: 100000,
    tenor: null,
    description: "Reksa dana dengan instrumen saham, risiko tinggi"
  },
];

const PPOBInvestasiPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("deposito");
  const [selectedProduct, setSelectedProduct] = useState<typeof investmentProducts[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Handle investment submission
  const handleInvestment = () => {
    if (!selectedProduct || !amount || parseInt(amount, 10) < selectedProduct.minAmount) return;
    
    setConfirmDialog(true);
  };

  // Process investment
  const processInvestment = () => {
    setConfirmDialog(false);
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `INV-${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setSuccessDialog(true);
    }, 1500);
  };

  // Format amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
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
            <h1 className="text-lg font-semibold">Investasi</h1>
            <p className="text-xs text-muted-foreground">Mulai investasi untuk masa depan</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Banner */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Icons.barChart className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium">Investasi Cerdas</h3>
            <p className="text-xs text-muted-foreground">Kelola keuangan dengan berbagai pilihan investasi</p>
          </div>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={(value) => {
              setActiveTab(value);
              setSelectedProduct(null);
              setAmount("");
            }}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="deposito">Deposito</TabsTrigger>
                <TabsTrigger value="emas">Emas Digital</TabsTrigger>
                <TabsTrigger value="reksadana">Reksa Dana</TabsTrigger>
              </TabsList>

              <TabsContent value="deposito" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Icons.wallet className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Deposito Digital</h3>
                    <p className="text-xs text-muted-foreground">Simpan dana dengan bunga kompetitif</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="emas" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Icons.creditCard className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Emas Digital</h3>
                    <p className="text-xs text-muted-foreground">Investasi emas tanpa perlu simpan fisik</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reksadana" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Icons.barChart className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Reksa Dana</h3>
                    <p className="text-xs text-muted-foreground">Investasi dikelola oleh manajer profesional</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Product List */}
        <div className="space-y-3">
          <Label className="text-base font-medium block">
            Pilih Produk Investasi
          </Label>
          
          {investmentProducts
            .filter(product => product.type === activeTab)
            .map((product) => (
              <div
                key={product.id}
                className={`border rounded-lg p-4 ${
                  selectedProduct?.id === product.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{product.name}</h3>
                  {product.interestRate && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {product.interestRate}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                <div className="flex justify-between text-sm">
                  <span>Min. Investasi: {formatRupiah(product.minAmount)}</span>
                  {product.tenor && <span>Tenor: {product.tenor}</span>}
                </div>
              </div>
            ))}
        </div>

        {/* Amount Input */}
        {selectedProduct && (
          <Card>
            <CardContent className="p-4">
              <Label className="text-base font-medium mb-3 block">
                Jumlah Investasi
              </Label>
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Input
                      className="h-12 pl-12 text-lg"
                      type="text"
                      inputMode="numeric"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder={`Min. ${formatRupiah(selectedProduct.minAmount)}`}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-gray-500 font-medium">Rp</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimal investasi {formatRupiah(selectedProduct.minAmount)}
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    isProcessing || 
                    !amount || 
                    parseInt(amount, 10) < selectedProduct.minAmount
                  }
                  onClick={handleInvestment}
                >
                  {isProcessing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Investasi Sekarang"
                  )}
                </Button>
                
                {amount && parseInt(amount, 10) < selectedProduct.minAmount && (
                  <p className="text-xs text-red-500 text-center">
                    Jumlah minimal investasi adalah {formatRupiah(selectedProduct.minAmount)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Investasi</DialogTitle>
            <DialogDescription>
              Pastikan detail investasi sudah sesuai sebelum melanjutkan
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produk</span>
                <span className="font-semibold">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jenis</span>
                <span className="font-semibold">
                  {investmentTypes.find(t => t.id === activeTab)?.name}
                </span>
              </div>
              {selectedProduct?.interestRate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bunga</span>
                  <span className="font-semibold text-green-600">{selectedProduct.interestRate}</span>
                </div>
              )}
              {selectedProduct?.tenor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenor</span>
                  <span className="font-semibold">{selectedProduct.tenor}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-semibold text-amber-500">
                  {formatRupiah(parseInt(amount, 10))}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-3 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              onClick={processInvestment} 
              className="flex-1"
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Investasi Berhasil!</DialogTitle>
            <DialogDescription className="text-center">
              {activeTab === "deposito" && "Deposito Anda telah berhasil dibuat"}
              {activeTab === "emas" && "Pembelian emas digital Anda berhasil"}
              {activeTab === "reksadana" && "Pembelian reksa dana Anda berhasil"}
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
                <span className="text-muted-foreground">Produk</span>
                <span className="font-semibold">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jenis</span>
                <span className="font-semibold">
                  {investmentTypes.find(t => t.id === activeTab)?.name}
                </span>
              </div>
              {selectedProduct?.interestRate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bunga</span>
                  <span className="font-semibold text-green-600">{selectedProduct.interestRate}</span>
                </div>
              )}
              {selectedProduct?.tenor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenor</span>
                  <span className="font-semibold">{selectedProduct.tenor}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-semibold text-amber-500">
                  {formatRupiah(parseInt(amount, 10))}
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
                    year: 'numeric'
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
                setSelectedProduct(null);
                setAmount("");
              }}
            >
              Investasi Lagi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBInvestasiPage;
