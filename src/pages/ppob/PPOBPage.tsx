import { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

// PPOB Feature Components
import { BillPayment } from "@/components/ppob/BillPayment";
import { DigitalProducts } from "@/components/ppob/DigitalProducts";
import { FundTransfer } from "@/components/ppob/FundTransfer";
import { PPOBHistory } from "@/components/ppob/PPOBHistory";
import { PPOBWallet } from "@/components/ppob/PPOBWallet";
import { PPOBNotifications } from "../../components/ppob/PPOBNotifications";

export default function PPOBPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bills");
  const [notificationCount, setNotificationCount] = useState(2); // Mock notification count
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<string | null>(null);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(125000); // Mock balance

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <MobileLayout>
      <Helmet>
        <title>Layanan PPOB - JPC Digi</title>
        <meta name="description" content="Pembayaran tagihan, pembelian produk digital, dan transfer dana dengan JPC Digi" />
      </Helmet>

      {/* Header with status bar and balance */}
      <div className="bg-primary text-white">
        {/* Status bar */}
        <div className="flex justify-between items-center p-2 text-xs">
          <div className="font-medium">10.34</div>
          <div className="flex items-center gap-1">
            <Icons.zap className="h-3 w-3" />
            <Icons.wifi className="h-3 w-3" />
            <div className="flex items-center gap-0.5 bg-white/20 px-1 rounded">
              <Icons.smartphone className="h-3 w-3" />
              <span>56</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white p-0 h-8 w-8" 
              onClick={() => navigate(-1)}
            >
              <Icons.chevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Layanan PPOB</h1>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white">
                <Icons.bell className="h-6 w-6" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0">
              <PPOBNotifications onClose={() => setNotificationCount(0)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance area */}
        <div className="mx-4 bg-white/10 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs opacity-80">Saldo PPOB</div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold">{formatRupiah(balance)}</span>
                <Button variant="ghost" size="sm" className="p-0 h-6 text-white">
                  <Icons.refreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setIsTopUpDialogOpen(true)}
                variant="secondary" 
                size="sm" 
                className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Icons.plus className="h-3 w-3 mr-1" />
                Top Up
              </Button>
              <Button 
                onClick={() => setIsWithdrawDialogOpen(true)}
                variant="secondary" 
                size="sm" 
                className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Icons.download className="h-3 w-3 mr-1" />
                Tarik
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Quick Access */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Akses Cepat</h2>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => navigate("/ppob/pulsa-data")}
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                <Icons.smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600">Pulsa & Data</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => navigate("/ppob/electricity")}
            >
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-1">
                <Icons.zap className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-xs text-gray-600">Listrik</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => navigate("/ppob/water")}
            >
              <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center mb-1">
                <Icons.droplet className="h-6 w-6 text-cyan-600" />
              </div>
              <span className="text-xs text-gray-600">PDAM</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => navigate("/ppob/internet")}
            >
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
                <Icons.wifi className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-xs text-gray-600">Internet</span>
            </Button>
          </div>
        </div>
        
        {/* Main PPOB Navigation */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Kategori Layanan</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4 bg-gray-100">
              <TabsTrigger value="bills" className="text-xs">Tagihan</TabsTrigger>
              <TabsTrigger value="digital" className="text-xs">Digital</TabsTrigger>
              <TabsTrigger value="transfers" className="text-xs">Transfer</TabsTrigger>
              <TabsTrigger value="wallet" className="text-xs">Wallet</TabsTrigger>
            </TabsList>
          
            <TabsContent value="bills">
              <BillPayment />
            </TabsContent>
            
            <TabsContent value="digital">
              <DigitalProducts />
            </TabsContent>
            
            <TabsContent value="transfers">
              <FundTransfer />
            </TabsContent>
            
            <TabsContent value="wallet">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="hover:bg-gray-50 cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center">
                      <Icons.plus className="h-8 w-8 mb-2 text-green-500" />
                      <span className="text-sm font-medium text-center">Top Up Saldo</span>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:bg-gray-50 cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center">
                      <Icons.download className="h-8 w-8 mb-2 text-orange-500" />
                      <span className="text-sm font-medium text-center">Tarik Saldo</span>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:bg-gray-50 cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center">
                      <Icons.history className="h-8 w-8 mb-2 text-blue-500" />
                      <span className="text-sm font-medium text-center">Riwayat</span>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:bg-gray-50 cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center">
                      <Icons.messageSquare className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium text-center">Bantuan</span>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-4">Riwayat Transaksi Terbaru</h3>
                  <PPOBHistory limit={5} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/ppob/dashboard")}
        >
          <Icons.home className="h-6 w-6" />
          <span className="text-xs">Beranda</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/ppob/activity")}
        >
          <Icons.activity className="h-6 w-6" />
          <span className="text-xs">Aktivitas</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1 relative"
        >
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center absolute -top-7">
            <div className="flex flex-col items-center">
              <span className="text-white text-xs font-bold">PAY</span>
              <div className="grid grid-cols-2 gap-1">
                <div className="h-2 w-2 bg-white rounded"></div>
                <div className="h-2 w-2 bg-white rounded"></div>
                <div className="h-2 w-2 bg-white rounded"></div>
                <div className="h-2 w-2 bg-white rounded"></div>
              </div>
            </div>
          </div>
          <div className="h-6"></div>
          <span className="text-xs"></span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/ppob/wallet")}
        >
          <Icons.wallet className="h-6 w-6" />
          <span className="text-xs">Dompet</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/profile")}
        >
          <Icons.users className="h-6 w-6" />
          <span className="text-xs">Saya</span>
        </Button>
      </div>
      
      {/* Top Up Dialog */}
      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {!transactionSuccess || transactionType !== "topup" ? (
            <>
              <DialogHeader>
                <DialogTitle>Top Up Wallet PPOB</DialogTitle>
                <DialogDescription>
                  Pilih metode pembayaran untuk top up saldo Wallet PPOB Anda.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Tabs defaultValue="bank">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="bank">Transfer Bank</TabsTrigger>
                    <TabsTrigger value="qr">Kode QR</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bank" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Nomor Virtual Account</h4>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-mono text-lg">8800112233445566</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Icons.copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Transfer ke nomor virtual account di atas dari bank manapun.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Nominal Top Up</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="justify-start">
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Rp 50.000
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Rp 100.000
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Rp 250.000
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Icons.plus className="mr-2 h-4 w-4" />
                          Rp 500.000
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="qr" className="space-y-4 mt-4">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="bg-white p-4 rounded-lg border">
                        <Icons.qrCode className="h-40 w-40" />
                      </div>
                      <Button variant="outline" size="sm">
                        <Icons.download className="mr-2 h-4 w-4" />
                        Unduh Kode QR
                      </Button>
                      <p className="text-sm text-center text-muted-foreground">
                        Pindai kode QR ini menggunakan aplikasi mobile banking atau e-wallet Anda untuk melakukan top up.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsTopUpDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      setTransactionType("topup");
                      setTransactionSuccess(true);
                    }, 1500);
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : "Konfirmasi Pembayaran"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Icons.check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-center">Top Up Berhasil</h2>
                <p className="text-center text-muted-foreground">
                  Permintaan top up Anda sedang diproses. Saldo akan ditambahkan ke wallet PPOB Anda segera setelah pembayaran dikonfirmasi.
                </p>
                
                <Button 
                  className="mt-4 w-full" 
                  onClick={() => {
                    setIsTopUpDialogOpen(false);
                    setTransactionSuccess(false);
                  }}
                >
                  Kembali ke Halaman PPOB
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {!transactionSuccess || transactionType !== "withdraw" ? (
            <>
              <DialogHeader>
                <DialogTitle>Tarik Saldo Wallet PPOB</DialogTitle>
                <DialogDescription>
                  Masukkan detail untuk penarikan saldo dari Wallet PPOB Anda.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Saldo Tersedia</h4>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="font-medium text-lg">{formatRupiah(balance)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Rekening Tujuan</h4>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">Bank BCA</p>
                      <p className="text-sm text-muted-foreground">1234567890 - John Doe</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                      Ubah
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Nominal Penarikan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start">
                      <Icons.arrowDownCircle className="mr-2 h-4 w-4" />
                      Rp 50.000
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Icons.arrowDownCircle className="mr-2 h-4 w-4" />
                      Rp 100.000
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Icons.arrowDownCircle className="mr-2 h-4 w-4" />
                      Rp 250.000
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Icons.arrowDownCircle className="mr-2 h-4 w-4" />
                      Rp 500.000
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsWithdrawDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      setTransactionType("withdraw");
                      setTransactionSuccess(true);
                    }, 1500);
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : "Konfirmasi Penarikan"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Icons.check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-center">Penarikan Berhasil</h2>
                <p className="text-center text-muted-foreground">
                  Permintaan penarikan Anda sedang diproses. Dana akan ditransfer ke rekening tujuan Anda dalam waktu 1x24 jam kerja.
                </p>
                
                <Button 
                  className="mt-4 w-full" 
                  onClick={() => {
                    setIsWithdrawDialogOpen(false);
                    setTransactionSuccess(false);
                  }}
                >
                  Kembali ke Halaman PPOB
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
