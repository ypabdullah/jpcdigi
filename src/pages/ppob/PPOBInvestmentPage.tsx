import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define interfaces for our investment products
interface CharcoalFundProduct {
  id: string;
  name: string;
  type: string;
  riskLevel: string;
  returnRate: string;
  minAmount: number;
  manager: string;
  isPromoted: boolean;
  description: string;
}

interface CharcoalBondProduct {
  id: string;
  name: string;
  issuer: string;
  minAmount: number;
  interestRate: number;
  period: string;
  isPromoted: boolean;
  description: string;
}

// Sample charcoal investment data
const charcoalFundProducts: CharcoalFundProduct[] = [
  {
    id: "charcoal-fund-1",
    name: "JPC Arang Premium",
    type: "Arang Kayu Keras",
    riskLevel: "Sedang",
    returnRate: "9-12% p.a.",
    minAmount: 1000000,
    manager: "JPC Asset Management",
    isPromoted: true,
    description: "Investasi pada produksi arang kayu berkualitas tinggi untuk kuliner dan BBQ",
  },
  {
    id: "charcoal-fund-2",
    name: "JPC Arang Ekspor",
    type: "Arang Ekspor",
    riskLevel: "Sedang-Tinggi",
    returnRate: "10-14% p.a.",
    minAmount: 2000000,
    manager: "JPC Asset Management",
    isPromoted: false,
    description: "Fokus pada perusahaan ekspor arang kayu ke pasar internasional",
  },
  {
    id: "charcoal-fund-3",
    name: "JPC Arang Briket",
    type: "Briket Arang",
    riskLevel: "Tinggi",
    returnRate: "12-18% p.a.",
    minAmount: 5000000,
    manager: "JPC Asset Management",
    isPromoted: true,
    description: "Mengembangkan teknologi briket arang untuk efisiensi dan keberlanjutan",
  },
  {
    id: "charcoal-fund-4",
    name: "JPC Arang Berkelanjutan",
    type: "Arang Ramah Lingkungan",
    riskLevel: "Sedang",
    returnRate: "8-11% p.a.",
    minAmount: 1500000,
    manager: "JPC Asset Management",
    isPromoted: false,
    description: "Investasi pada perusahaan arang dengan praktik penanaman kembali dan keberlanjutan",
  },
];

const charcoalBondProducts: CharcoalBondProduct[] = [
  {
    id: "charcoal-bond-1",
    name: "Obligasi JPC Arang A",
    issuer: "JPC Arang Indonesia",
    minAmount: 2000000,
    interestRate: 8.5,
    period: "3 tahun",
    isPromoted: true,
    description: "Obligasi korporasi untuk pengembangan fasilitas produksi arang kayu",
  },
  {
    id: "charcoal-bond-2",
    name: "Obligasi JPC Arang B",
    issuer: "JPC Arang Indonesia",
    minAmount: 5000000,
    interestRate: 9.25,
    period: "5 tahun",
    isPromoted: false,
    description: "Pendanaan untuk modernisasi teknologi pembuatan arang berkualitas tinggi",
  },
  {
    id: "charcoal-bond-3",
    name: "Sukuk JPC Arang",
    issuer: "JPC Arang Syariah",
    minAmount: 1000000,
    interestRate: 7.5,
    period: "2 tahun",
    isPromoted: true,
    description: "Instrumen keuangan syariah berbasis aset produksi arang kayu",
  },
  {
    id: "charcoal-bond-4",
    name: "Green Bond JPC Arang",
    issuer: "JPC Arang Indonesia",
    minAmount: 3000000,
    interestRate: 8.0,
    period: "4 tahun",
    isPromoted: false,
    description: "Obligasi untuk pengembangan arang yang ramah lingkungan dan berkelanjutan",
  },
];

// Format rupiah
const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const PPOBInvestmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("charcoalFund");
  const [selectedProduct, setSelectedProduct] = useState<CharcoalFundProduct | CharcoalBondProduct | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
  };

  const handleInvestmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, "");
    setInvestmentAmount(value);
  };

  const handleSubmit = () => {
    // Here you would normally validate and process the investment
    setShowConfirmation(false);
    setInvestmentSuccess(true);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setInvestmentAmount("");
    setInvestmentSuccess(false);
  };

  return (
    <MobileLayout>
      {/* Custom Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate("/ppob/all")}
          className="flex items-center justify-center w-10 h-10"
        >
          <Icons.arrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium">Investasi</h1>
        <button className="flex items-center justify-center w-10 h-10">
          <Icons.bell className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        {/* Investment Banner */}
        <div className="mb-6 bg-gradient-to-r from-amber-800 to-stone-900 rounded-xl p-4 text-white">
          <h2 className="text-xl font-bold mb-1">Investasi Arang Kayu JPC</h2>
          <p className="text-sm mb-3">Dapatkan keuntungan dari industri arang kayu premium dengan produk investasi kami</p>
          <div className="flex items-center space-x-2">
            <Icons.flame className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-medium">Potensi imbal hasil hingga 18% per tahun</span>
          </div>
        </div>

        {/* Investment Product Tabs */}
        <Tabs defaultValue="charcoalFund" className="w-full mb-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charcoalFund">Dana Arang</TabsTrigger>
            <TabsTrigger value="charcoalBond">Obligasi Arang</TabsTrigger>
          </TabsList>

          {/* Charcoal Fund Products */}
          <TabsContent value="charcoalFund">
            <div className="grid gap-4 mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Dana Arang adalah produk investasi yang berfokus pada sektor arang kayu premium dengan potensi pertumbuhan tinggi.
              </p>
              <ScrollArea className="h-[450px] pr-3">
                {charcoalFundProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`mb-4 relative ${
                      selectedProduct?.id === product.id ? "border-2 border-primary" : ""
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          <CardDescription>{product.manager}</CardDescription>
                        </div>
                        {product.isPromoted && (
                          <Badge className="bg-amber-500">Rekomendasi</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Bunga</p>
                          <p className="font-semibold text-green-600">{product.returnRate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tingkat Risiko</p>
                          <p className="font-semibold">{product.riskLevel}</p>
                        </div>
                        <div className="col-span-2 mt-2">
                          <p className="text-gray-500">Minimal Penempatan</p>
                          <p className="font-semibold">{formatRupiah(product.minAmount)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                          setShowConfirmation(true);
                        }}
                      >
                        Pilih Dana Arang
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Charcoal Bond Products */}
          <TabsContent value="charcoalBond">
            <div className="grid gap-4 mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Obligasi Arang adalah obligasi yang diterbitkan oleh perusahaan arang kayu dengan imbal hasil yang menarik.
              </p>
              <ScrollArea className="h-[450px] pr-3">
                {charcoalBondProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`mb-4 relative ${
                      selectedProduct?.id === product.id ? "border-2 border-primary" : ""
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          <CardDescription>{product.issuer}</CardDescription>
                        </div>
                        {product.isPromoted && (
                          <Badge className="bg-amber-500">Rekomendasi</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Bunga</p>
                          <p className="font-semibold text-green-600">{product.interestRate}% p.a.</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Jangka Waktu</p>
                          <p className="font-semibold">{product.period}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Penerbit</p>
                          <p className="font-semibold">{product.issuer}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Minimal Investasi</p>
                          <p className="font-semibold">{formatRupiah(product.minAmount)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductSelect(product);
                          setShowConfirmation(true);
                        }}
                      >
                        Pilih Obligasi Arang
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Investment Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Konfirmasi Investasi</DialogTitle>
            <DialogDescription className="text-center">
              {activeTab === "deposito" ? "Deposito" : "Reksadana"} - {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Investasi</Label>
              <Input
                id="amount"
                placeholder={`Min. ${formatRupiah(selectedProduct?.minAmount || 0)}`}
                value={investmentAmount ? formatRupiah(parseInt(investmentAmount)) : ""}
                onChange={handleInvestmentAmountChange}
                className="text-right"
              />
              {parseInt(investmentAmount) < (selectedProduct?.minAmount || 0) && investmentAmount !== "" && (
                <p className="text-red-500 text-xs">
                  Jumlah investasi minimal {formatRupiah(selectedProduct?.minAmount || 0)}
                </p>
              )}
            </div>

            {activeTab === "charcoalFund" && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Jenis</span>
                  <span className="font-semibold">{(selectedProduct as CharcoalFundProduct)?.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tingkat Risiko</span>
                  <span className="font-semibold">{(selectedProduct as CharcoalFundProduct)?.riskLevel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Imbal Hasil</span>
                  <span className="font-semibold text-green-600">{(selectedProduct as CharcoalFundProduct)?.returnRate}</span>
                </div>
                {investmentAmount && parseInt(investmentAmount) >= (selectedProduct?.minAmount || 0) && (
                  <div className="flex justify-between text-sm">
                    <span>Estimasi Bunga</span>
                    <span className="font-semibold text-green-600">
                      {activeTab === 'charcoalFund' ? 
                        (selectedProduct as CharcoalFundProduct)?.returnRate : 
                        formatRupiah(
                          parseInt(investmentAmount) * ((selectedProduct as CharcoalBondProduct)?.interestRate / 100) * 
                          (parseInt(((selectedProduct as CharcoalBondProduct)?.period?.split(' ')[0]) || '1'))
                        )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "charcoalBond" && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bunga</span>
                  <span className="font-semibold">{(selectedProduct as CharcoalBondProduct)?.interestRate}% p.a.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Jangka Waktu</span>
                  <span className="font-semibold">{(selectedProduct as CharcoalBondProduct)?.period}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Penerbit</span>
                  <span className="font-semibold">{(selectedProduct as CharcoalBondProduct)?.issuer}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={!investmentAmount || parseInt(investmentAmount) < (selectedProduct?.minAmount || 0)}
            >
              Konfirmasi Investasi
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setShowConfirmation(false)}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={investmentSuccess} onOpenChange={setInvestmentSuccess}>
        <DialogContent className="max-w-md p-6">
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Icons.check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Investasi Berhasil!</DialogTitle>
            <DialogDescription>
              Investasi {activeTab === "charcoalFund" ? "Dana Arang" : "Obligasi Arang"} {selectedProduct?.name} sebesar {formatRupiah(parseInt(investmentAmount))} telah berhasil dilakukan.
            </DialogDescription>
            
            <div className="mt-6 w-full space-y-3">
              <Button className="w-full" onClick={() => navigate("/ppob/activity")}>
                Lihat Transaksi
              </Button>
              <Button variant="outline" className="w-full" onClick={resetForm}>
                Investasi Lainnya
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBInvestmentPage;
