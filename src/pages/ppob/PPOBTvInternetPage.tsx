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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatRupiah } from "@/lib/utils";

// Sample providers
const providers = [
  { id: "indihome", name: "IndiHome", icon: "wifi" },
  { id: "firstmedia", name: "First Media", icon: "tv" },
  { id: "biznet", name: "Biznet", icon: "wifi" },
  { id: "mncplay", name: "MNC Play", icon: "tv" },
  { id: "myrepublic", name: "MyRepublic", icon: "wifi" },
];

// Recent customer IDs
const recentCustomers = [
  { id: "1", name: "Rumah Utama", number: "12345678901", provider: "IndiHome" },
  { id: "2", name: "Apartemen", number: "23456789012", provider: "First Media" },
];

const PPOBTvInternetPage = () => {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("indihome");
  const [customerInfo, setCustomerInfo] = useState<{ name: string; address: string; bill: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Check customer ID
  const checkCustomerId = () => {
    if (!customerId || customerId.length < 8) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setCustomerInfo({
        name: "Ahmad Supriadi",
        address: "Jl. Tebet Timur Raya No. 45, Jakarta Selatan",
        bill: 385000
      });
      setIsChecking(false);
    }, 1000);
  };

  // Handle payment
  const handlePayment = () => {
    if (!customerId || !customerInfo) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `TX${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setSuccessDialog(true);
    }, 1500);
  };

  // Render provider icon
  const renderProviderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "wifi":
        return <Icons.wifi className={className} />;
      case "tv":
        return <Icons.tv className={className} />;
      default:
        return <Icons.monitor className={className} />;
    }
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
            <h1 className="text-lg font-semibold">TV Kabel & Internet</h1>
            <p className="text-xs text-muted-foreground">Bayar tagihan internet dan TV kabel</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Provider Selection */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">Pilih Provider</Label>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`border rounded-lg p-3 flex flex-col items-center ${
                    selectedProvider === provider.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedProvider === provider.id
                      ? "bg-primary/10"
                      : "bg-gray-100"
                  }`}>
                    {renderProviderIcon(provider.icon, `h-5 w-5 ${
                      selectedProvider === provider.id
                        ? "text-primary"
                        : "text-gray-500"
                    }`)}
                  </div>
                  <span className="mt-2 text-xs font-medium">{provider.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer ID Input */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Nomor Pelanggan {providers.find(p => p.id === selectedProvider)?.name}
            </Label>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Input
                    className="h-12 pl-12 text-lg"
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
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

              {/* Recent customer IDs */}
              {recentCustomers.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Nomor tersimpan
                  </Label>
                  <div className="space-y-2">
                    {recentCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                        onClick={() => setCustomerId(customer.number)}
                      >
                        <div>
                          <div className="font-medium text-sm">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {customer.number} • {customer.provider}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Pilih
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={checkCustomerId}
                disabled={customerId.length < 8 || isChecking}
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

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Total Tagihan</Label>
                    <div className="text-xl font-bold text-amber-500">
                      {formatRupiah(customerInfo.bill)}
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
                    `Bayar ${formatRupiah(customerInfo.bill)}`
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
              Tagihan {providers.find(p => p.id === selectedProvider)?.name} Anda telah berhasil dibayar
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
                <span className="font-semibold">{customerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-semibold">{customerInfo?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Layanan</span>
                <span className="font-semibold">
                  {providers.find(p => p.id === selectedProvider)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tagihan</span>
                <span className="font-semibold text-amber-500">
                  {formatRupiah(customerInfo?.bill || 0)}
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
                setCustomerId("");
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

export default PPOBTvInternetPage;
