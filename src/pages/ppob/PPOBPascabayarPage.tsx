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

// Mobile operators
const operators = [
  { id: "telkomsel", name: "Telkomsel Halo", icon: "phone", color: "bg-red-100", iconColor: "text-red-500" },
  { id: "indosat", name: "Indosat Matrix", icon: "phone", color: "bg-yellow-100", iconColor: "text-yellow-600" },
  { id: "xl", name: "XL Prioritas", icon: "phone", color: "bg-blue-100", iconColor: "text-blue-500" },
  { id: "smartfren", name: "Smartfren Postpaid", icon: "phone", color: "bg-purple-100", iconColor: "text-purple-500" },
  { id: "three", name: "3 Postpaid", icon: "phone", color: "bg-indigo-100", iconColor: "text-indigo-500" },
];

// Recent payments
const recentPayments = [
  { id: "1", name: "Pribadi", number: "081234567890", operator: "telkomsel", period: "Juni 2025" },
  { id: "2", name: "Kantor", number: "087654321098", operator: "xl", period: "Mei 2025" },
];

const PPOBPascabayarPage = () => {
  const navigate = useNavigate();
  const [operator, setOperator] = useState("telkomsel");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    accountNumber: string;
    period: string;
    dueAmount: number;
    dueDate: string;
    packageInfo: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Check phone number
  const checkPhoneNumber = () => {
    if (!phoneNumber || phoneNumber.length < 10) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setCustomerInfo({
        name: "Budi Setiawan",
        accountNumber: operator.toUpperCase() + "-" + phoneNumber,
        period: "Juni 2025",
        dueAmount: 285000,
        dueDate: "25 Juni 2025",
        packageInfo: "Pascabayar Medium 15GB + Unlimited Call"
      });
      setIsChecking(false);
    }, 1000);
  };

  // Select a recent payment
  const selectRecentPayment = (payment: typeof recentPayments[0]) => {
    setOperator(payment.operator);
    setPhoneNumber(payment.number);
    setTimeout(() => {
      checkPhoneNumber();
    }, 300);
  };

  // Handle payment
  const handlePayment = () => {
    if (!phoneNumber || !customerInfo) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `PSCA-${Date.now().toString().slice(-8)}`;
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
            <h1 className="text-lg font-semibold">Pascabayar</h1>
            <p className="text-xs text-muted-foreground">Bayar tagihan Pascabayar (Postpaid)</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Banner */}
        <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Icons.smartphone className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-medium">Pembayaran Pascabayar</h3>
            <p className="text-xs text-muted-foreground">Bayar tagihan pascabayar dari berbagai operator</p>
          </div>
        </div>

        {/* Operator Selection */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">Pilih Operator</Label>
            <div className="grid grid-cols-3 gap-2">
              {operators.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setOperator(op.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    operator === op.id ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full ${op.color} flex items-center justify-center mb-2`}>
                    <Icons.phone className={`h-5 w-5 ${op.iconColor}`} />
                  </div>
                  <span className="text-xs text-center font-medium">{op.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Phone Number Input */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Nomor Telepon
            </Label>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Input
                    className="h-12 pl-12 text-lg"
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Masukkan nomor telepon"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Icons.phone className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Masukkan nomor telepon pascabayar Anda
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
                            {payment.number} • {operators.find(op => op.id === payment.operator)?.name.split(' ')[0]}
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
                onClick={checkPhoneNumber}
                disabled={phoneNumber.length < 10 || isChecking}
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
                  <Label className="text-sm text-muted-foreground">Nomor Telepon</Label>
                  <div className="font-medium">{phoneNumber}</div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Periode Tagihan</Label>
                    <div className="font-medium">{customerInfo.period}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Jatuh Tempo</Label>
                    <div className="font-medium">{customerInfo.dueDate}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Paket</Label>
                  <div className="font-medium">{customerInfo.packageInfo}</div>
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
              Tagihan Pascabayar {operators.find(op => op.id === operator)?.name} telah berhasil dibayar
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
                <span className="text-muted-foreground">Nomor Telepon</span>
                <span className="font-semibold">{phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-semibold">{customerInfo?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-semibold">
                  {operators.find(op => op.id === operator)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periode</span>
                <span className="font-semibold">{customerInfo?.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-semibold">
                  {customerInfo?.packageInfo}
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
                setPhoneNumber("");
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

export default PPOBPascabayarPage;
