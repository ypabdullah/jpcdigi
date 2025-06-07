import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Pre-defined top-up amounts
const predefinedAmounts = [
  { id: 1, amount: 50000 },
  { id: 2, amount: 100000 },
  { id: 3, amount: 150000 },
  { id: 4, amount: 200000 },
  { id: 5, amount: 500000 },
  { id: 6, amount: 1000000 },
];

// Payment methods
const paymentMethods = [
  { id: "bca", name: "BCA", logo: "/logos/bca.png", fallback: "BC" },
  { id: "mandiri", name: "Mandiri", logo: "/logos/mandiri.png", fallback: "MD" },
  { id: "bni", name: "BNI", logo: "/logos/bni.png", fallback: "BN" },
  { id: "bri", name: "BRI", logo: "/logos/bri.png", fallback: "BR" },
  { id: "gopay", name: "GoPay", logo: "/logos/gopay.png", fallback: "GP" },
  { id: "ovo", name: "OVO", logo: "/logos/ovo.png", fallback: "OV" },
];

const PPOBTopUpPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Handle amount selection
  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
    setCustomAmount(new Intl.NumberFormat("id-ID").format(selectedAmount));
  };

  // Handle custom amount input changes with formatting
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setAmount("");
      setCustomAmount("");
      return;
    }
    setAmount(value);
    setCustomAmount(new Intl.NumberFormat("id-ID").format(parseInt(value)));
  };

  // Handle top-up submission
  const handleTopUp = () => {
    if (!amount || !selectedMethod) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Create transaction ID
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
            <h1 className="text-lg font-semibold">Top Up Saldo</h1>
            <p className="text-xs text-muted-foreground">Isi Ulang Saldo Anda</p>
          </div>
          <div className="ml-auto rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm">
            <Icons.file className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Current Balance Card */}
        <Card className="border-none shadow-sm mb-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-xs opacity-80 mb-1">Saldo Anda</span>
              <span className="text-2xl font-bold">Rp2.500.000</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="amount" className="mb-6">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="amount">Nominal</TabsTrigger>
            <TabsTrigger value="payment">Metode Pembayaran</TabsTrigger>
          </TabsList>
          
          <TabsContent value="amount">
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-sm p-5 mb-6">
                <div className="text-center">
                  <Label htmlFor="customAmount" className="text-muted-foreground text-xs font-medium">JUMLAH TOP UP</Label>
                  <div className="relative mt-3 mb-2">
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary mr-1">Rp</span>
                      <Input
                        id="customAmount"
                        placeholder="0"
                        className="text-3xl font-bold text-center border-none shadow-none focus-visible:ring-0 w-[60%] h-14 bg-transparent px-0"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mx-4">
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Min: Rp10.000</Badge>
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Maks: Rp10.000.000</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pilih Nominal</Label>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedAmounts.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant={amount === item.amount.toString() ? "default" : "outline"}
                      className={cn(
                        "h-12 font-medium", 
                        amount === item.amount.toString() 
                          ? "bg-primary text-white" 
                          : "border-gray-200 text-gray-700"
                      )}
                      onClick={() => handleAmountSelect(item.amount)}
                    >
                      {formatRupiah(item.amount)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full mt-4" 
                size="lg"
                disabled={!amount}
                onClick={() => {
                  document.querySelector('[data-value="payment"]')?.dispatchEvent(
                    new MouseEvent('click', { bubbles: true })
                  );
                }}
              >
                Lanjutkan
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="payment">
            <div className="space-y-4">
              <Card className="border-none shadow-sm bg-muted/20 mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Top Up</p>
                      <p className="font-bold text-lg">{formatRupiah(parseInt(amount || "0"))}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        document.querySelector('[data-value="amount"]')?.dispatchEvent(
                          new MouseEvent('click', { bubbles: true })
                        );
                      }}
                    >
                      Ubah
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pilih Metode Pembayaran</Label>
                <div className="grid gap-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
                        selectedMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      )}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={method.logo} alt={method.name} />
                        <AvatarFallback>{method.fallback}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{method.name}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center">
                        {selectedMethod === method.id && (
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full mt-4" 
                size="lg"
                disabled={!selectedMethod || !amount || isProcessing}
                onClick={handleTopUp}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : `Bayar ${formatRupiah(parseInt(amount || "0"))}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Success Dialog */}
        <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Top Up Berhasil!</DialogTitle>
              <DialogDescription className="text-center">
                Saldo Anda berhasil ditambahkan
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-center py-6">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <Icons.check className="h-10 w-10 text-green-600" />
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-semibold">{formatRupiah(parseInt(amount || "0"))}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-semibold">
                  {paymentMethods.find(m => m.id === selectedMethod)?.name || ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Transaksi</span>
                <span className="font-semibold">{transactionId}</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                className="w-full"
                onClick={() => {
                  setSuccessDialog(false);
                  navigate("/ppob");
                }}
              >
                Kembali ke Beranda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default PPOBTopUpPage;
