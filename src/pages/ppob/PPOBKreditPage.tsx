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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";

// Credit/Loan Providers
const kreditProviders = [
  { id: "adira", name: "Adira Finance", icon: "creditCard", color: "bg-orange-100", iconColor: "text-orange-500" },
  { id: "fif", name: "Federal International Finance (FIF)", icon: "creditCard", color: "bg-blue-100", iconColor: "text-blue-500" },
  { id: "wom", name: "Wahana Ottomitra Multiartha (WOM)", icon: "creditCard", color: "bg-indigo-100", iconColor: "text-indigo-500" },
  { id: "baf", name: "Bussan Auto Finance (BAF)", icon: "creditCard", color: "bg-red-100", iconColor: "text-red-500" },
  { id: "mandiriTunas", name: "Mandiri Tunas Finance", icon: "creditCard", color: "bg-green-100", iconColor: "text-green-500" },
  { id: "bca", name: "BCA Finance", icon: "creditCard", color: "bg-blue-100", iconColor: "text-blue-500" },
  { id: "acc", name: "Astra Credit Companies (ACC)", icon: "creditCard", color: "bg-red-100", iconColor: "text-red-500" },
];

// Recent payments
const recentPayments = [
  { id: "1", name: "Motor Supra X", number: "088123456789", provider: "adira", installment: "5/36" },
  { id: "2", name: "Mobil Avanza", number: "082345678901", provider: "bca", installment: "12/60" },
];

const PPOBKreditPage = () => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState("adira");
  const [contractNumber, setContractNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    contractId: string;
    assetName: string;
    installmentPeriod: string;
    dueDate: string;
    dueAmount: number;
    remainingInstallments: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Check contract number
  const checkContractNumber = () => {
    if (!contractNumber || contractNumber.length < 8) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setCustomerInfo({
        name: "Ahmad Riyanto",
        contractId: selectedProvider.toUpperCase() + "-" + contractNumber,
        assetName: "Honda Vario 125cc",
        installmentPeriod: "Juni 2025",
        dueDate: "15 Juni 2025",
        dueAmount: 785000,
        remainingInstallments: "18/36"
      });
      setIsChecking(false);
    }, 1000);
  };

  // Select a recent payment
  const selectRecentPayment = (payment: typeof recentPayments[0]) => {
    setSelectedProvider(payment.provider);
    setContractNumber(payment.number);
    setTimeout(() => {
      checkContractNumber();
    }, 300);
  };

  // Handle payment
  const handlePayment = () => {
    if (!contractNumber || !customerInfo) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `KREDIT-${Date.now().toString().slice(-8)}`;
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
            <h1 className="text-lg font-semibold">Angsuran Kredit</h1>
            <p className="text-xs text-muted-foreground">Bayar tagihan angsuran kredit</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Banner */}
        <div className="bg-orange-50 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Icons.calculator className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-medium">Pembayaran Angsuran Kredit</h3>
            <p className="text-xs text-muted-foreground">Bayar cicilan dari berbagai perusahaan pembiayaan</p>
          </div>
        </div>

        {/* Credit Provider Selection */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">Pilih Penyedia Kredit</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Pilih Penyedia" />
              </SelectTrigger>
              <SelectContent>
                {kreditProviders.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Contract Number Input */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Nomor Kontrak / Nomor Perjanjian
            </Label>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Input
                    className="h-12 pl-12 text-lg"
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Masukkan nomor kontrak"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Icons.fileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nomor kontrak tertera pada buku angsuran atau SMS tagihan
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
                            {payment.number} • {kreditProviders.find(p => p.id === payment.provider)?.name.split(' ')[0]}
                          </div>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                          Angsuran {payment.installment}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={checkContractNumber}
                disabled={contractNumber.length < 8 || isChecking}
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
                  <Label className="text-sm text-muted-foreground">Nomor Kontrak</Label>
                  <div className="font-medium">{customerInfo.contractId}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Nama Aset</Label>
                  <div className="font-medium">{customerInfo.assetName}</div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Periode Tagihan</Label>
                    <div className="font-medium">{customerInfo.installmentPeriod}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Jatuh Tempo</Label>
                    <div className="font-medium">{customerInfo.dueDate}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Sisa Angsuran</Label>
                  <div className="font-medium">{customerInfo.remainingInstallments}</div>
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
              Angsuran kredit {kreditProviders.find(p => p.id === selectedProvider)?.name} Anda telah berhasil dibayar
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
                <span className="text-muted-foreground">Nomor Kontrak</span>
                <span className="font-semibold">{customerInfo?.contractId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-semibold">{customerInfo?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aset</span>
                <span className="font-semibold">{customerInfo?.assetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periode</span>
                <span className="font-semibold">{customerInfo?.installmentPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penyedia</span>
                <span className="font-semibold">
                  {kreditProviders.find(p => p.id === selectedProvider)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sisa Angsuran</span>
                <span className="font-semibold text-primary">
                  {customerInfo?.remainingInstallments}
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
                setContractNumber("");
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

export default PPOBKreditPage;
