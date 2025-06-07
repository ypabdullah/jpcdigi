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

// City/Regions for PBB
const pbbRegions = [
  { id: "jakarta", name: "DKI Jakarta" },
  { id: "bandung", name: "Bandung" },
  { id: "surabaya", name: "Surabaya" },
  { id: "semarang", name: "Semarang" },
  { id: "medan", name: "Medan" },
  { id: "makassar", name: "Makassar" },
  { id: "yogyakarta", name: "Yogyakarta" },
  { id: "denpasar", name: "Denpasar" },
];

// Recent payments
const recentPayments = [
  { id: "1", name: "Rumah Utama", number: "32.71.010.001.000-0123.0", region: "jakarta", year: "2025" },
  { id: "2", name: "Properti Investasi", number: "32.71.020.002.000-0456.0", region: "bandung", year: "2024" },
];

const PPOBPbbPage = () => {
  const navigate = useNavigate();
  const [region, setRegion] = useState("jakarta");
  const [nop, setNop] = useState("");
  const [propertyInfo, setPropertyInfo] = useState<{
    ownerName: string;
    address: string;
    propertyClass: string;
    taxYear: string;
    dueAmount: number;
    buildingArea: string;
    landArea: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  // Check NOP (Nomor Objek Pajak)
  const checkNop = () => {
    if (!nop || nop.length < 10) return;
    
    setIsChecking(true);
    
    // Simulate API call
    setTimeout(() => {
      setPropertyInfo({
        ownerName: "Budi Hartono",
        address: "Jl. Setiabudi No. 45, Kelurahan Karet, Kecamatan Setiabudi",
        propertyClass: "Perumahan",
        taxYear: "2025",
        dueAmount: 1250000,
        buildingArea: "120m²",
        landArea: "150m²"
      });
      setIsChecking(false);
    }, 1000);
  };

  // Select a recent payment
  const selectRecentPayment = (payment: typeof recentPayments[0]) => {
    setRegion(payment.region);
    setNop(payment.number);
    setTimeout(() => {
      checkNop();
    }, 300);
  };

  // Handle payment
  const handlePayment = () => {
    if (!nop || !propertyInfo) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      const txId = `PBB-${Date.now().toString().slice(-8)}`;
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
            <h1 className="text-lg font-semibold">Pajak PBB</h1>
            <p className="text-xs text-muted-foreground">Bayar Pajak Bumi dan Bangunan (PBB)</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Banner */}
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Icons.building className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium">Pembayaran PBB</h3>
            <p className="text-xs text-muted-foreground">Bayar Pajak Bumi dan Bangunan dengan mudah</p>
          </div>
        </div>

        {/* Region Selection */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">Pilih Wilayah</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Pilih Wilayah" />
              </SelectTrigger>
              <SelectContent>
                {pbbRegions.map(reg => (
                  <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* NOP Input */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-base font-medium mb-3 block">
              Nomor Objek Pajak (NOP)
            </Label>
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Input
                    className="h-12 pl-12 text-lg"
                    type="text"
                    value={nop}
                    onChange={(e) => setNop(e.target.value)}
                    placeholder="Contoh: 32.71.010.001.000-0123.0"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Icons.fileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nomor Objek Pajak tertera pada Surat Pemberitahuan Pajak Terutang (SPPT)
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
                            {payment.number.substring(0, 15)}...
                          </div>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                          {payment.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={checkNop}
                disabled={nop.length < 10 || isChecking}
              >
                {isChecking ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Memeriksa...
                  </>
                ) : (
                  "Periksa Tagihan PBB"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        {propertyInfo && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nama Wajib Pajak</Label>
                  <div className="font-medium">{propertyInfo.ownerName}</div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Alamat Objek Pajak</Label>
                  <div className="font-medium">{propertyInfo.address}</div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Tahun Pajak</Label>
                    <div className="font-medium">{propertyInfo.taxYear}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Kelas</Label>
                    <div className="font-medium">{propertyInfo.propertyClass}</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Luas Bangunan</Label>
                    <div className="font-medium">{propertyInfo.buildingArea}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Luas Tanah</Label>
                    <div className="font-medium">{propertyInfo.landArea}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Total Tagihan</Label>
                    <div className="text-xl font-bold text-amber-500">
                      {formatRupiah(propertyInfo.dueAmount)}
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
                    `Bayar ${formatRupiah(propertyInfo.dueAmount)}`
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
              Tagihan PBB untuk {propertyInfo?.taxYear} telah berhasil dibayar
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
                <span className="text-muted-foreground">NOP</span>
                <span className="font-semibold">{nop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-semibold">{propertyInfo?.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wilayah</span>
                <span className="font-semibold">
                  {pbbRegions.find(r => r.id === region)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tahun Pajak</span>
                <span className="font-semibold">{propertyInfo?.taxYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Detail Properti</span>
                <span className="font-semibold">
                  {propertyInfo?.landArea} / {propertyInfo?.buildingArea}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tagihan</span>
                <span className="font-semibold text-amber-500">
                  {formatRupiah(propertyInfo?.dueAmount || 0)}
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
                setNop("");
                setPropertyInfo(null);
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

export default PPOBPbbPage;
