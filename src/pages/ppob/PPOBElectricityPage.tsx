import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { Icons } from "@/components/ui/icons";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ChevronLeft, File, Copy, Check, Zap, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { digiflazzService } from "@/services/digiflazz";
import { formatRupiah } from "@/lib/utils";
import { tokenOptions } from "@/lib/tokenOptions";

interface CustomerInfo {
  name: string;
  address: string;
}

interface RecentMeter {
  id: string;
  number: string;
  name: string;
}

interface TokenOption {
  value: string;
  label: string;
  desc: string;
  price: number;
}

const tokenOptions: TokenOption[] = [
  {
    value: "20",
    label: "Token 20RB",
    desc: "Token listrik 20 ribu",
    price: 20000
  },
  {
    value: "50",
    label: "Token 50RB",
    desc: "Token listrik 50 ribu",
    price: 50000
  },
  {
    value: "100",
    label: "Token 100RB",
    desc: "Token listrik 100 ribu",
    price: 100000
  },
  {
    value: "200",
    label: "Token 200RB",
    desc: "Token listrik 200 ribu",
    price: 200000
  }
];

const PPOBElectricityPage = () => {
  const navigate = useNavigate();
  const [meterNumber, setMeterNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [token, setToken] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [recentMeters, setRecentMeters] = useState<string[]>([]);

  const handleTokenSelect = (token: string, price: number) => {
    setSelectedToken(token);
    setSelectedPrice(price);
  };

  const checkMeterNumber = async () => {
    try {
      setIsChecking(true);
      setError(null);
      
      const response = await digiflazzService.inquiryPostpaid(meterNumber);
      if (response.status === 'success') {
        setCustomerInfo({
          name: response.data.customer_name || '',
          address: response.data.address || ''
        });
        // Save meter number to recent meters
        const newMeter = {
          id: Date.now().toString(),
          number: meterNumber,
          name: response.data.customer_name || 'Pelanggan'
        };
        setRecentMeters(prev => [newMeter, ...prev].slice(0, 5));
      } else {
        setError(response.message || 'Gagal memeriksa nomor meter');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memeriksa nomor meter');
      console.error('Error checking meter number:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const refId = Date.now().toString();
      const response = await digiflazzService.payPostpaid({
        meter_number: meterNumber,
        nominal: selectedToken,
        ref_id: refId
      });

      if (response.status === 'success') {
        setToken(response.data.sn);
        setTransactionId(response.data.transaction_id);
        setSuccessDialog(true);
      } else {
        setError(response.message || 'Gagal membeli token');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membeli token');
      console.error('Error purchasing token:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-center">Memproses transaksi...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-2" />
          </div>
        </div>
      )}
      <MobileLayout>
        {/* Custom Header */}
        <div className="bg-gradient-to-b from-blue-50 to-white">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
            <button 
              onClick={() => navigate("/ppob")} 
              className="rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm"
            >
              <Icons icon={ChevronLeft} className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Token Listrik</h1>
              <p className="text-xs text-muted-foreground">Beli token listrik prabayar</p>
            </div>
            <div className="ml-auto rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm">
              <Icons icon={File} className="h-5 w-5" />
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓</span>
                        <span className="text-sm text-green-600">Nomor valid</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="meterNumber"
                        type="text"
                        value={meterNumber}
                        onChange={(e) => setMeterNumber(e.target.value)}
                        placeholder="Masukkan nomor meter"
                        className={cn(
                          "w-full",
                          customerInfo ? "border-green-500" : ""
                        )}
                      />
                    </div>
                    <Button
                      onClick={checkMeterNumber}
                      disabled={isChecking || !meterNumber}
                    >
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Cek Meter"
                      )}
                    </Button>
                  </div>
                </div>

                {customerInfo && (
                  <div className="border-t pt-4 mt-4">
                    <div className="mb-3">
                      <Label className="text-sm font-medium">Pilih Nominal</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {tokenOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedToken === option.value ? "default" : "outline"}
                          onClick={() => handleTokenSelect(option.value, option.price)}
                          className="flex flex-col items-center justify-center gap-2"
                        >
                          <Icons icon={Zap} className="h-5 w-5" />
                          <span className="font-medium">{option.label}</span>
                          <span className="text-sm text-muted-foreground">{formatRupiah(option.price)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {customerInfo && selectedToken && (
                  <div className="border-t pt-4 mt-4">
                    <div className="mb-3">
                      <Label className="text-sm font-medium">Ringkasan Pembayaran</Label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nominal</span>
                        <span className="font-semibold">
                          {formatRupiah(selectedPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin</span>
                        <span className="font-semibold">Rp1.500</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">
                          {formatRupiah(selectedPrice + 1500)}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePurchase}
                      className="w-full mt-4"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        "Beli Token"
                      )}
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
              <DialogTitle>Berhasil!</DialogTitle>
              <DialogDescription>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Token Anda</Label>
                    <div className="bg-green-50/50 p-4 rounded-lg text-center">
                      <p className="text-xl font-bold">{token}</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(token);
                          toast.success("Token berhasil disalin!");
                        }}
                      >
                        <Icons icon={Copy} className="mr-2 h-4 w-4" />
                        Salin Token
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Detail Pembelian</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meter Number</span>
                        <span className="font-semibold">{meterNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nama</span>
                        <span className="font-semibold">{customerInfo?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nominal</span>
                        <span className="font-semibold">
                          {formatRupiah(selectedPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin</span>
                        <span className="font-semibold">Rp1.500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Transaksi</span>
                        <span className="font-semibold">{transactionId}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSuccessDialog(false);
                      navigate("/ppob");
                    }}
                    className="w-full"
                  >
                    Selesai
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </MobileLayout>
    </>
  );
};

export default PPOBElectricityPage;
