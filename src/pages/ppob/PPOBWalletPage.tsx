import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import QRCode from "react-qr-code";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Icons } from "@/components/Icons";
import { PPOBWalletStatement } from "@/components/ppob/PPOBWalletStatement";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PPOBWalletPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [balance, setBalance] = useState(750000);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [virtualAccountNumber, setVirtualAccountNumber] = useState("88750012345678");
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [transactionType, setTransactionType] = useState<"topup" | "withdraw" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "qrcode">("transfer");
  const [showQRCode, setShowQRCode] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "in" | "out">("all");
  
  // Track last transaction for user feedback
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    amount: number;
    type: "topup" | "withdraw";
    status: "success" | "pending" | "failed";
    timestamp: Date;
  } | null>(null);

  // Currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle top-up submission
  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTransactionType("topup");
    
    // Simulate API call
    setTimeout(() => {
      const amount = parseInt(topUpAmount.replace(/\D/g, ""));
      setBalance(prevBalance => prevBalance + amount);
      setIsProcessing(false);
      setTransactionSuccess(true);
      
      // Record the transaction for history
      const transactionId = `TP${Date.now().toString().slice(-8)}`;
      setLastTransaction({
        id: transactionId,
        amount: amount,
        type: "topup",
        status: "success",
        timestamp: new Date()
      });
      
      // Reset after some time
      setTimeout(() => {
        setIsTopUpDialogOpen(false);
        setTopUpAmount("");
        setTransactionSuccess(false);
      }, 2000);
    }, 1500);
  };

  // Handle withdrawal submission
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTransactionType("withdraw");
    
    // Simulate API call
    setTimeout(() => {
      const amount = parseInt(withdrawAmount.replace(/\D/g, ""));
      setBalance(prevBalance => prevBalance - amount);
      setIsProcessing(false);
      setTransactionSuccess(true);
      
      // Record the transaction for history
      const transactionId = `WD${Date.now().toString().slice(-8)}`;
      setLastTransaction({
        id: transactionId,
        amount: amount,
        type: "withdraw",
        status: "success",
        timestamp: new Date()
      });
      
      // Reset after some time
      setTimeout(() => {
        setIsWithdrawDialogOpen(false);
        setWithdrawAmount("");
        setWithdrawBank("");
        setAccountNumber("");
        setTransactionSuccess(false);
      }, 2000);
    }, 1500);
  };

  // Handle amount input changes with formatting
  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setter("");
      return;
    }
    setter(new Intl.NumberFormat("id-ID").format(parseInt(value)));
  };
  return (
    <MobileLayout
      title="PPOB Wallet"
      subtitle="Kelola saldo PPOB Anda"
      withBackButton
      onBackButtonClick={() => navigate("/ppob")}
    >
      <div className="container max-w-md mx-auto px-4 py-6">
        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Saldo</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Saldo PPOB Wallet</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab("history")}
                >
                  <Icons.history className="h-4 w-4 mr-1" />
                  Riwayat
                </Button>
              </div>
              
              <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white mb-6">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-100">Saldo Tersedia</p>
                    <h3 className="text-3xl font-bold">{formatCurrency(balance)}</h3>
                    <p className="text-xs text-blue-100">
                      Terakhir diperbarui: {new Date().toLocaleString("id-ID")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="h-auto py-4 flex flex-col items-center"
                  onClick={() => setIsTopUpDialogOpen(true)}
                >
                  <Icons.plus className="h-6 w-6 mb-1" />
                  <span>Top Up</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center"
                  onClick={() => setIsWithdrawDialogOpen(true)}
                >
                  <Icons.arrowRight className="h-6 w-6 mb-1" />
                  <span>Tarik Dana</span>
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-4">Transaksi Terakhir</h2>
              {lastTransaction ? (
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge variant={lastTransaction.type === "topup" ? "success" : "destructive"}>
                          {lastTransaction.type === "topup" ? "Top Up" : "Tarik Dana"}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">
                          {lastTransaction.type === "topup" ? "+" : "-"}{formatCurrency(lastTransaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lastTransaction.timestamp.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <Badge variant={lastTransaction.status === "success" ? "outline" : "secondary"}>
                        {lastTransaction.status === "success" ? "Berhasil" : 
                         lastTransaction.status === "pending" ? "Diproses" : "Gagal"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Belum ada transaksi</p>
                </div>
              )}
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/ppob/history?wallet=true")}
                >
                  Lihat Semua Transaksi
                  <Icons.arrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-medium mb-4">Riwayat Transaksi</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Icons.arrowDownCircle className="h-4 w-4 mr-2 text-green-600" />
                      Uang Masuk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-bold text-green-600 hover:text-green-700 hover:bg-transparent"
                      onClick={() => navigate("/ppob/history?filter=in")}
                    >
                      Lihat
                      <Icons.chevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Icons.arrowUpCircle className="h-4 w-4 mr-2 text-red-600" />
                      Uang Keluar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-bold text-red-600 hover:text-red-700 hover:bg-transparent"
                      onClick={() => navigate("/ppob/history?filter=out")}
                    >
                      Lihat
                      <Icons.chevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2">
                <PPOBWalletStatement />
              </div>
              
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate("/ppob/history?wallet=true")}>
                  <Icons.wallet className="mr-2 h-4 w-4" />
                  Lihat Transaksi Wallet
                </Button>
                <Button variant="link" onClick={() => navigate("/ppob/history")}>
                  <Icons.history className="mr-2 h-4 w-4" />
                  Semua Transaksi
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Top-up Dialog */}
      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Saldo</DialogTitle>
            <DialogDescription>
              Tambah saldo PPOB Wallet Anda dengan mudah.
            </DialogDescription>
          </DialogHeader>
          
          {transactionSuccess && transactionType === "topup" ? (
            <div className="py-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Icons.check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-bold text-lg">Top Up Berhasil!</h3>
              <p className="text-muted-foreground">
                Saldo Anda telah bertambah
                {lastTransaction && (
                  <span className="block font-semibold mt-1 text-green-600">
                    {formatCurrency(lastTransaction.amount)}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastTransaction && (
                  <>ID Transaksi: {lastTransaction.id}<br/>Waktu: {lastTransaction.timestamp.toLocaleString('id-ID')}</>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleTopUp}>
              <Tabs defaultValue="transfer" className="w-full" onValueChange={(value) => setPaymentMethod(value as "transfer" | "qrcode")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transfer">Transfer Bank</TabsTrigger>
                  <TabsTrigger value="qrcode">QR Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transfer" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        id="amount"
                        placeholder="0"
                        className="pl-9"
                        value={topUpAmount}
                        onChange={(e) => handleAmountChange(e, setTopUpAmount)}
                        required
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <p className="text-muted-foreground">Min: Rp10.000</p>
                      <p className="text-muted-foreground">Maks: Rp10.000.000</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[100000, 200000, 500000, 1000000].map((amount) => (
                        <Button 
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[80px]"
                          onClick={() => setTopUpAmount(new Intl.NumberFormat("id-ID").format(amount))}
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label>Metode Pembayaran</Label>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Icons.creditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Virtual Account</p>
                              <p className="text-sm text-muted-foreground">{virtualAccountNumber}</p>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              navigator.clipboard.writeText(virtualAccountNumber);
                              // Show toast or notification
                              alert("Nomor Virtual Account disalin!");
                            }}
                          >
                            <Icons.copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground">
                      Transfer ke nomor virtual account di atas untuk melakukan top up. Saldo akan bertambah otomatis setelah transfer berhasil.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="qrcode" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-amount">Jumlah</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        id="qr-amount"
                        placeholder="0"
                        className="pl-9"
                        value={topUpAmount}
                        onChange={(e) => handleAmountChange(e, setTopUpAmount)}
                        required
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <p className="text-muted-foreground">Min: Rp10.000</p>
                      <p className="text-muted-foreground">Maks: Rp10.000.000</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[100000, 200000, 500000, 1000000].map((amount) => (
                        <Button 
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[80px]"
                          onClick={() => setTopUpAmount(new Intl.NumberFormat("id-ID").format(amount))}
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    {showQRCode ? (
                      <div className="p-4 border-2 border-dashed border-muted-foreground/50 rounded-lg">
                        <div className="bg-white p-2 rounded-md">
                          <QRCode value={`JPC:TOPUP:${topUpAmount.replace(/\D/g, "")}:${Date.now()}`} size={180} />
                        </div>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="mt-2 text-xs"
                          onClick={() => setShowQRCode(false)}
                        >
                          Ubah Nominal
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          // Validate minimum amount
                          const amount = parseInt(topUpAmount.replace(/\D/g, "")) || 0;
                          if (amount < 10000) {
                            alert("Minimal top up adalah Rp10.000");
                            return;
                          }
                          if (amount > 10000000) {
                            alert("Maksimal top up adalah Rp10.000.000");
                            return;
                          }
                          setShowQRCode(true);
                        }}
                        disabled={!topUpAmount}
                        className="w-full py-8"
                      >
                        <Icons.qrCode className="mr-2 h-5 w-5" />
                        Generate QR Code
                      </Button>
                    )}
                  </div>
                  
                  {showQRCode && (
                    <p className="text-sm text-center text-muted-foreground">
                      Scan QR code ini dengan aplikasi e-wallet atau mobile banking Anda untuk melakukan pembayaran.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsTopUpDialogOpen(false);
                    setShowQRCode(false);
                    setTopUpAmount("");
                  }}
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                
                {paymentMethod === "transfer" ? (
                  <Button 
                    type="submit"
                    disabled={!topUpAmount || isProcessing || parseInt(topUpAmount.replace(/\D/g, "")) < 10000}
                  >
                    {isProcessing ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : "Konfirmasi Top Up"}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={() => {
                      setIsProcessing(true);
                      setTransactionType("topup");
                      
                      // Simulate API call
                      setTimeout(() => {
                        const amount = parseInt(topUpAmount.replace(/\D/g, ""));
                        setBalance(prevBalance => prevBalance + amount);
                        setIsProcessing(false);
                        setTransactionSuccess(true);
                        
                        // Record the transaction for history
                        const transactionId = `TP${Date.now().toString().slice(-8)}`;
                        setLastTransaction({
                          id: transactionId,
                          amount: amount,
                          type: "topup",
                          status: "success",
                          timestamp: new Date()
                        });
                        
                        // Reset after some time
                        setTimeout(() => {
                          setIsTopUpDialogOpen(false);
                          setTopUpAmount("");
                          setShowQRCode(false);
                          setTransactionSuccess(false);
                        }, 2000);
                      }, 1500);
                    }}
                    disabled={!topUpAmount || !showQRCode || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : "Saya Sudah Bayar"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tarik Dana</DialogTitle>
            <DialogDescription>
              Tarik dana dari PPOB Wallet Anda ke rekening bank yang terdaftar.
            </DialogDescription>
          </DialogHeader>
          
          {transactionSuccess && transactionType === "withdraw" ? (
            <div className="py-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Icons.check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-bold text-lg">Penarikan Berhasil!</h3>
              <p className="text-muted-foreground">
                Dana akan masuk ke rekening bank Anda dalam 1x24 jam kerja
                {lastTransaction && (
                  <span className="block font-semibold mt-1 text-red-600">
                    {formatCurrency(lastTransaction.amount)}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastTransaction && (
                  <>ID Transaksi: {lastTransaction.id}<br/>Waktu: {lastTransaction.timestamp.toLocaleString('id-ID')}</>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleWithdraw}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Jumlah</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="withdraw-amount"
                      placeholder="0"
                      className="pl-9"
                      value={withdrawAmount}
                      onChange={(e) => handleAmountChange(e, setWithdrawAmount)}
                      required
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <p className="text-muted-foreground">Min: Rp50.000</p>
                    <p className="text-muted-foreground">Maks: Rp5.000.000</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saldo tersedia: {formatCurrency(balance)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdraw-bank">Bank Tujuan</Label>
                  <Select 
                    value={withdrawBank} 
                    onValueChange={setWithdrawBank}
                    required
                  >
                    <SelectTrigger id="withdraw-bank">
                      <SelectValue placeholder="Pilih bank tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bca">Bank BCA</SelectItem>
                      <SelectItem value="bni">Bank BNI</SelectItem>
                      <SelectItem value="mandiri">Bank Mandiri</SelectItem>
                      <SelectItem value="bri">Bank BRI</SelectItem>
                      <SelectItem value="permata">Bank Permata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account-number">Nomor Rekening</Label>
                  <Input
                    id="account-number"
                    placeholder="Contoh: 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsWithdrawDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  disabled={
                    !withdrawAmount || 
                    !withdrawBank || 
                    !accountNumber || 
                    isProcessing || 
                    parseInt(withdrawAmount.replace(/\D/g, "")) < 50000 ||
                    parseInt(withdrawAmount.replace(/\D/g, "")) > balance
                  }
                >
                  {isProcessing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : "Tarik Dana"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBWalletPage;
