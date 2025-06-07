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

// BPJS Types
const bpjsTypes = [
  { id: "kesehatan", name: "BPJS Kesehatan", icon: "heartPulse", color: "bg-red-100", iconColor: "text-red-500" },
  { id: "ketenagakerjaan", name: "BPJS Ketenagakerjaan", icon: "briefcase", color: "bg-blue-100", iconColor: "text-blue-500" }
];

// Recent payments
const recentPayments = [
  { id: "1", name: "Budi Santoso", number: "0001234567890", type: "kesehatan", period: "Januari 2025" },
  { id: "2", name: "Rina Wijaya", number: "0001987654321", type: "ketenagakerjaan", period: "Desember 2024" },
];

const PPOBBpjsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kesehatan");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    address: string;
    memberId: string;
    period: string;
    dueAmount: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Check customer number
  const checkCustomerNumber = () => {
    if (!customerNumber || customerNumber.length < 10) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setCustomerInfo({
        name: "Budi Santoso",
        address: "Jl. Sudirman No. 123, Jakarta Pusat",
        memberId: "KS-" + customerNumber,
        period: "Juni 2025",
        dueAmount: activeTab === "kesehatan" ? 150000 : 89000
      });
      setIsChecking(false);
    }, 1000);
  };

  // Select a recent payment
  const selectRecentPayment = (payment: typeof recentPayments[0]) => {
    setActiveTab(payment.type);
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
      const txId = `BPJS-${Date.now().toString().slice(-8)}`;
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
            <h1 className="text-lg font-semibold">BPJS</h1>
            <p className="text-xs text-muted-foreground">Bayar tagihan BPJS</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* BPJS Type Tabs */}
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="kesehatan">BPJS Kesehatan</TabsTrigger>
                <TabsTrigger value="ketenagakerjaan">BPJS Ketenagakerjaan</TabsTrigger>
              </TabsList>

              <TabsContent value="kesehatan" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Icons.heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">BPJS Kesehatan</h3>
                    <p className="text-xs text-muted-foreground">Pembayaran iuran BPJS Kesehatan</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ketenagakerjaan" className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icons.briefcase className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">BPJS Ketenagakerjaan</h3>
                    <p className="text-xs text-muted-foreground">Pembayaran iuran BPJS Ketenagakerjaan</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Customer Number Input */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">
              {activeTab === "kesehatan" 
                ? "Nomor Kartu BPJS Kesehatan" 
                : "Nomor Peserta BPJS Ketenagakerjaan"}
            </Label>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Input
                    className="h-12 pl-12 text-lg"
                    type="text"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    placeholder="Masukkan nomor BPJS"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Icons.creditCard className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nomor BPJS tertera pada kartu BPJS Anda
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
                            {payment.number} • {payment.type === "kesehatan" ? "Kesehatan" : "Ketenagakerjaan"}
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
                disabled={customerNumber.length < 10 || isChecking}
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
                  <Label className="text-sm text-muted-foreground">Nama Peserta</Label>
                  <div className="font-medium">{customerInfo.name}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Alamat</Label>
                  <div className="font-medium">{customerInfo.address}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">ID Peserta</Label>
                  <div className="font-medium">{customerInfo.memberId}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Periode</Label>
                  <div className="font-medium">{customerInfo.period}</div>
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
              Tagihan BPJS {activeTab === "kesehatan" ? "Kesehatan" : "Ketenagakerjaan"} Anda telah berhasil dibayar
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
                <span className="text-muted-foreground">Nomor BPJS</span>
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
                <span className="text-muted-foreground">Layanan</span>
                <span className="font-semibold">
                  BPJS {activeTab === "kesehatan" ? "Kesehatan" : "Ketenagakerjaan"}
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

export default PPOBBpjsPage;
