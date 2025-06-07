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

// PDAM Regions
const pdamRegions = [
  { id: "jakarta", name: "PDAM Jakarta (PAM Jaya)" },
  { id: "bandung", name: "PDAM Bandung" },
  { id: "surabaya", name: "PDAM Surabaya" },
  { id: "semarang", name: "PDAM Semarang" },
  { id: "medan", name: "PDAM Medan" },
  { id: "makassar", name: "PDAM Makassar" },
  { id: "denpasar", name: "PDAM Denpasar" },
  { id: "yogyakarta", name: "PDAM Yogyakarta" },
];

// Recent payments
const recentPayments = [
  { id: "1", name: "Rumah Utama", number: "10203040", region: "jakarta", period: "Juni 2025" },
  { id: "2", name: "Kontrakan", number: "20304050", region: "bandung", period: "Mei 2025" },
];

const PPOBPdamPage = () => {
  const navigate = useNavigate();
  const [region, setRegion] = useState("jakarta");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    address: string;
    period: string;
    usage: string;
    dueAmount: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Check customer number
  const checkCustomerNumber = () => {
    if (!customerNumber || customerNumber.length < 5) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setCustomerInfo({
        name: "Bambang Setiawan",
        address: "Jl. Merdeka No. 45, Kelurahan Sejahtera, Kecamatan Makmur",
        period: "Juni 2025",
        usage: "18m³",
        dueAmount: 147500
      });
      setIsChecking(false);
    }, 1000);
  };

  // Select a recent payment
  const selectRecentPayment = (payment: typeof recentPayments[0]) => {
    setRegion(payment.region);
    setCustomerNumber(payment.number);
    setTimeout(() => {
      checkCustomerNumber();
    }, 300);
  };

  // Handle payment
  const handlePayment = () => {
    if (!customerNumber || !customerInfo) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `PDAM-${Date.now().toString().slice(-8)}`;
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
            <h1 className="text-lg font-semibold">PDAM</h1>
            <p className="text-xs text-muted-foreground">Bayar tagihan air PDAM</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Banner */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Icons.droplet className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium">Pembayaran PDAM</h3>
            <p className="text-xs text-muted-foreground">Bayar tagihan air dari berbagai wilayah</p>
          </div>
        </div>

        {/* PDAM Region Selection */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">Wilayah PDAM</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Pilih Wilayah PDAM" />
              </SelectTrigger>
              <SelectContent>
                {pdamRegions.map(reg => (
                  <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Customer Number Input */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Nomor Pelanggan PDAM
            </Label>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Input
                    className="h-12 pl-12 text-lg"
                    type="text"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    placeholder="Masukkan nomor pelanggan"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Icons.fileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nomor pelanggan tertera pada tagihan bulanan Anda
                </p>
              </div>

              {/* Recent payments */}
              {recentPayments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Pembayaran terakhir
                  </Label>
                  <div className="space-y-2">
                    {recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                        onClick={() => selectRecentPayment(payment)}
                      >
                        <div>
                          <div className="font-medium text-sm">{payment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {payment.number} • {pdamRegions.find(r => r.id === payment.region)?.name.split(' ')[1]}
                          </div>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                          {payment.period}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={checkCustomerNumber}
                disabled={customerNumber.length < 5 || isChecking}
              >
                {isChecking ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  "Periksa Tagihan"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        {customerInfo && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nama Pelanggan</Label>
                  <div className="font-medium">{customerInfo.name}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Alamat</Label>
                  <div className="font-medium">{customerInfo.address}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Periode Tagihan</Label>
                  <div className="font-medium">{customerInfo.period}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Pemakaian</Label>
                  <div className="font-medium">{customerInfo.usage}</div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Total Tagihan</Label>
                    <div className="text-xl font-bold text-amber-500">
                      {formatRupiah(customerInfo.dueAmount)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Termasuk biaya admin Rp2.500
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memproses Pembayaran...
                    </>
                  ) : (
                    `Bayar ${formatRupiah(customerInfo.dueAmount)}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pembayaran Berhasil!</DialogTitle>
            <DialogDescription className="text-center">
              Tagihan PDAM {pdamRegions.find(r => r.id === region)?.name.split(' ')[1]} Anda telah berhasil dibayar
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
                <span className="text-muted-foreground">Nomor Pelanggan</span>
                <span className="font-semibold">{customerNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-semibold">{customerInfo?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periode</span>
                <span className="font-semibold">{customerInfo?.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pemakaian</span>
                <span className="font-semibold">{customerInfo?.usage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wilayah</span>
                <span className="font-semibold">
                  {pdamRegions.find(r => r.id === region)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tagihan</span>
                <span className="font-semibold text-amber-500">
                  {formatRupiah(customerInfo?.dueAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Transaksi</span>
                <span className="font-semibold">{transactionId}</span>
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
                setCustomerNumber("");
                setCustomerInfo(null);
              }}
            >
              Transaksi Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBPdamPage;
