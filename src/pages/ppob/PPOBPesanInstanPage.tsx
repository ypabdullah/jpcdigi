import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Use the Icons component for all icons
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Sample restaurant data
const restaurants = [
  {
    id: "gofood",
    name: "GoFood",
    logo: "https://food.grab.com/static/images/favicon-food.ico",
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    restaurants: [
      { id: "r1", name: "McDonald's", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r2", name: "KFC", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r3", name: "Pizza Hut", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r4", name: "Burger King", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
    ]
  },
  {
    id: "grabfood",
    name: "GrabFood",
    logo: "https://food.grab.com/static/images/favicon-food.ico",
    color: "bg-green-600",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    restaurants: [
      { id: "r1", name: "Starbucks", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r2", name: "Domino's Pizza", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r3", name: "Chatime", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r4", name: "Yoshinoya", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
    ]
  },
  {
    id: "shopeefood",
    name: "ShopeeFood",
    logo: "https://food.grab.com/static/images/favicon-food.ico",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    restaurants: [
      { id: "r1", name: "HokBen", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r2", name: "Ta Wan", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r3", name: "Solaria", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
      { id: "r4", name: "Sushi Tei", image: "https://d1sag4ddilekf6.cloudfront.net/compressed_webp/merchants/AWh64KYIZXYdMpch3WwN/hero/1c6c633fa86c4b6b9ff17f1eaafcc1bc_1593052064783721325.webp" },
    ]
  },
];

// Voucher data
const vouchers = [
  { id: "v1", platform: "gofood", name: "Voucher GoFood Rp50.000", price: 47500, value: 50000 },
  { id: "v2", platform: "gofood", name: "Voucher GoFood Rp100.000", price: 95000, value: 100000 },
  { id: "v3", platform: "grabfood", name: "Voucher GrabFood Rp50.000", price: 47500, value: 50000 },
  { id: "v4", platform: "grabfood", name: "Voucher GrabFood Rp100.000", price: 95000, value: 100000 },
  { id: "v5", platform: "shopeefood", name: "Voucher ShopeeFood Rp50.000", price: 47500, value: 50000 },
  { id: "v6", platform: "shopeefood", name: "Voucher ShopeeFood Rp100.000", price: 95000, value: 100000 },
];

const PPOBPesanInstanPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("voucher");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");

  // Filter vouchers by selected platform
  const filteredVouchers = selectedPlatform 
    ? vouchers.filter(v => v.platform === selectedPlatform) 
    : vouchers;

  // Handle voucher selection
  const handleSelectVoucher = (voucher: any) => {
    setSelectedVoucher(voucher);
    setIsPaymentDialogOpen(true);
  };

  // Process payment
  const handleProcessPayment = () => {
    if (!selectedVoucher || !email) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Generate transaction ID
      const txId = `FD${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      setIsSuccessDialogOpen(true);
    }, 2000);
  };

  // Reset after transaction
  const handleCloseSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    setSelectedVoucher(null);
    setEmail("");
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm font-medium">Memproses...</span>
    </div>
  );

  return (
    <MobileLayout>
      {/* Header */}
      <div className="bg-gradient-to-b from-red-500 to-red-700 text-white">
        <div className="flex items-center gap-4 px-4 py-3">
          <button 
            onClick={() => navigate("/ppob")} 
            className="rounded-full w-8 h-8 flex items-center justify-center bg-white/20"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Pesan Instan</h1>
            <p className="text-xs text-white/70">Beli voucher makanan & minuman</p>
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="voucher" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="voucher">Voucher</TabsTrigger>
            <TabsTrigger value="popular">Restoran Populer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="voucher" className="space-y-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pilih Platform</Label>
              <div className="grid grid-cols-3 gap-3">
                {restaurants.map((platform) => (
                  <div
                    key={platform.id}
                    className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                      selectedPlatform === platform.id 
                        ? `border-2 border-primary ${platform.bgColor}` 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlatform(platform.id === selectedPlatform ? null : platform.id)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        selectedPlatform === platform.id ? platform.bgColor : "bg-gray-100"
                      }`}
                    >
                      {selectedPlatform === platform.id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Icons.check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={platform.color}>
                          {platform.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-xs font-medium">{platform.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vouchers */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Pilih Voucher</h2>
              <div className="space-y-3">
                {filteredVouchers.map((voucher) => (
                  <Card
                    key={voucher.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectVoucher(voucher)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={restaurants.find(r => r.id === voucher.platform)?.color || "bg-gray-100"}>
                            {restaurants.find(r => r.id === voucher.platform)?.name.substring(0, 1) || "V"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{voucher.name}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">
                              {restaurants.find(r => r.id === voucher.platform)?.name}
                            </Badge>
                            <span className="font-semibold text-primary">{formatRupiah(voucher.price)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredVouchers.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Silakan pilih platform untuk melihat voucher</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="space-y-4">
            {/* Popular Restaurants */}
            <div className="space-y-4">
              {restaurants.map((platform) => (
                <div key={platform.id} className="space-y-2">
                  <h2 className="text-lg font-semibold">{platform.name}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {platform.restaurants.map((restaurant) => (
                      <Card 
                        key={restaurant.id} 
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-0">
                          <div className="aspect-video bg-muted">
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate">{restaurant.name}</h3>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="text-xs">
                                {platform.name}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembelian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={restaurants.find(r => r.id === selectedVoucher?.platform)?.color || "bg-gray-100"}>
                    {restaurants.find(r => r.id === selectedVoucher?.platform)?.name.substring(0, 1) || "V"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedVoucher?.name}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {restaurants.find(r => r.id === selectedVoucher?.platform)?.name}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Penerima</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Voucher akan dikirim ke email ini
                  </p>
                </div>

                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Harga Voucher</span>
                    <span className="text-sm font-medium">{selectedVoucher ? formatRupiah(selectedVoucher.price) : "-"}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-muted-foreground">Biaya Admin</span>
                    <span className="text-sm font-medium">Rp 0</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold text-primary">{selectedVoucher ? formatRupiah(selectedVoucher.price) : "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            {isProcessing ? (
              <LoadingSpinner />
            ) : (
              <>
                <Button 
                  className="w-full" 
                  onClick={handleProcessPayment} 
                  disabled={!email || !selectedVoucher}
                >
                  Beli Sekarang
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Batal
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Icons.check className="h-10 w-10 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold mb-1">Pembelian Berhasil!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Voucher telah dikirim ke email Anda
            </p>
            
            <div className="w-full bg-muted/30 p-4 rounded-lg space-y-3 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Voucher</span>
                <span className="text-sm font-medium">{selectedVoucher?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="text-sm font-medium">
                  {restaurants.find(r => r.id === selectedVoucher?.platform)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jumlah</span>
                <span className="text-sm font-medium">{selectedVoucher ? formatRupiah(selectedVoucher.price) : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID Transaksi</span>
                <span className="text-sm font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Waktu</span>
                <span className="text-sm font-medium">
                  {new Date().toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleCloseSuccessDialog}
              >
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Beli Lagi
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => navigate("/ppob")}
              >
                Selesai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBPesanInstanPage;
