import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Pre-defined token values
const tokenOptions = [
  { value: "20000", label: "Token 20rb", price: 22500, desc: "Token Listrik 20.000 VA" },
  { value: "50000", label: "Token 50rb", price: 51500, desc: "Token Listrik 50.000 VA" },
  { value: "100000", label: "Token 100rb", price: 101500, desc: "Token Listrik 100.000 VA" },
  { value: "200000", label: "Token 200rb", price: 201500, desc: "Token Listrik 200.000 VA" },
  { value: "500000", label: "Token 500rb", price: 501500, desc: "Token Listrik 500.000 VA" },
  { value: "1000000", label: "Token 1jt", price: 1001500, desc: "Token Listrik 1.000.000 VA" },
];

// Recent meters
const recentMeters = [
  { id: "1", name: "Rumah Utama", number: "12345678901", address: "Jl. Kemang Raya No. 10" },
  { id: "2", name: "Apartemen", number: "23456789012", address: "Apartemen Sudirman Park Tower A/12" },
];

const PPOBElectricityPage = () => {
  const navigate = useNavigate();
  const [meterNumber, setMeterNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{ name: string; address: string } | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [token, setToken] = useState("");

  // Check meter number
  const checkMeterNumber = () => {
    if (!meterNumber || meterNumber.length < 10) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setCustomerInfo({
        name: "Aga Tampan",
        address: "Jl. Gatot Subroto No. 12, Jakarta Selatan"
      });
      setIsChecking(false);
    }, 1000);
  };

  // Handle purchase
  const handlePurchase = () => {
    if (!meterNumber || !selectedToken) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Generate token and transaction ID
      const generatedToken = Array(20).fill(0).map(() => Math.floor(Math.random() * 10)).join("");
      setToken(generatedToken);
      
      const txId = `TX${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setSuccessDialog(true);
    }, 1500);
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm font-medium">Memproses...</span>
    </div>
  );

  return (
    <MobileLayout>
      {/* Custom Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <button 
            onClick={() => navigate("/ppob")} 
            className="rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Token Listrik</h1>
            <p className="text-xs text-muted-foreground">Beli token listrik prabayar</p>
          </div>
          <div className="ml-auto rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm">
            <Icons.file className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="meterNumber" className="font-medium">ID Pelanggan / Nomor Meter</Label>
                  {customerInfo && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary h-8 px-2"
                      onClick={() => {
                        setMeterNumber("");
                        setCustomerInfo(null);
                        setSelectedToken(null);
                      }}
                    >
                      Ubah
                    </Button>
                  )}
                </div>
                {!customerInfo ? (
                  <>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Icons.zap className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="meterNumber"
                        placeholder="Contoh: 12345678901"
                        className="pl-9 bg-muted/30"
                        value={meterNumber}
                        onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ""))}
                        disabled={isChecking}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Masukkan nomor meter atau ID pelanggan PLN
                    </p>

                    {recentMeters.length > 0 && (
                      <div className="mt-4 bg-muted/20 rounded-lg p-3">
                        <h3 className="text-sm font-medium mb-2">Meter Tersimpan</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {recentMeters.map((meter) => (
                            <div 
                              key={meter.id}
                              onClick={() => setMeterNumber(meter.number)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Icons.zap className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{meter.name}</p>
                                <p className="text-xs text-muted-foreground">{meter.number}</p>
                              </div>
                              <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center">
                                {meterNumber === meter.number && (
                                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <Button 
                        className="w-full" 
                        disabled={meterNumber.length < 10 || isChecking}
                        onClick={checkMeterNumber}
                      >
                        {isChecking ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Memeriksa...</span>
                          </div>
                        ) : "Periksa Nomor Meter"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icons.users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{customerInfo.name}</h3>
                        <p className="text-xs text-muted-foreground">{meterNumber}</p>
                        <p className="text-xs text-muted-foreground">{customerInfo.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {customerInfo && (
                <div className="border-t pt-4 mt-4">
                  <div className="mb-3">
                    <Label className="text-sm font-medium">Pilih Nominal</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {tokenOptions.map((option) => (
                      <div 
                        key={option.value}
                        className={cn(
                          "border rounded-lg p-3 cursor-pointer transition-colors",
                          selectedToken === option.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-primary/50"
                        )}
                        onClick={() => setSelectedToken(option.value)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">{option.label}</span>
                          {selectedToken === option.value && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Icons.check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{option.desc}</p>
                        <p className="text-sm font-medium text-primary">{formatRupiah(option.price)}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    disabled={!selectedToken || isProcessing}
                    onClick={handlePurchase}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Memproses...</span>
                      </div>
                    ) : "Beli Token"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pembelian Berhasil!</DialogTitle>
            <DialogDescription className="text-center">
              Token listrik berhasil dibeli
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Icons.check className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <div className="flex flex-col items-center mb-4 bg-primary/10 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Token Anda</p>
              <p className="font-mono text-xl font-bold tracking-wider">{token}</p>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Nomor Meter</span>
              <span className="font-semibold">{meterNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-semibold">{customerInfo?.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Nominal</span>
              <span className="font-semibold">
                {formatRupiah(parseInt(selectedToken || "0"))}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Admin</span>
              <span className="font-semibold">Rp1.500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Transaksi</span>
              <span className="font-semibold">{transactionId}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(token);
                // Show toast or notification
                alert("Token berhasil disalin!");
              }}
            >
              <Icons.copy className="mr-2 h-4 w-4" />
              Salin Token
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setSuccessDialog(false);
                navigate("/ppob");
              }}
            >
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBElectricityPage;
