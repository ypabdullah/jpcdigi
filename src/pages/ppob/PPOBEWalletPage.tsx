import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Popular e-wallets in Indonesia
const eWallets = [
  { 
    id: "gopay", 
    name: "GoPay", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/180px-Gopay_logo.svg.png",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50" 
  },
  { 
    id: "ovo", 
    name: "OVO", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/180px-Logo_ovo_purple.svg.png",
    color: "bg-purple-500",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50" 
  },
  { 
    id: "dana", 
    name: "DANA", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/180px-Logo_dana_blue.svg.png",
    color: "bg-blue-400",
    textColor: "text-blue-500",
    bgColor: "bg-blue-50" 
  },
  { 
    id: "linkaja", 
    name: "LinkAja", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/LinkAja.svg/180px-LinkAja.svg.png",
    color: "bg-red-500",
    textColor: "text-red-600",
    bgColor: "bg-red-50" 
  },
  { 
    id: "shopeepay", 
    name: "ShopeePay", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/ShopeePay_logo.svg/180px-ShopeePay_logo.svg.png",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50" 
  }
];

// Recent transfers
const recentTransfers = [
  { walletId: "dana", accountNumber: "081234567890", name: "Budi Santoso" },
  { walletId: "gopay", accountNumber: "081387654321", name: "Siti Rahayu" },
  { walletId: "ovo", accountNumber: "081598765432", name: "Ahmad Hidayat" }
];

const PPOBEWalletPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("transfer");
  const [balance] = useState<number>(750000);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [recipientVerified, setRecipientVerified] = useState<boolean>(false);
  const [recipientName, setRecipientName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");

  // Format phone number with proper Indonesian format
  const formatPhoneNumber = (input: string) => {
    const cleaned = input.replace(/\D/g, "");
    
    if (cleaned.length <= 4) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 10)}-${cleaned.slice(10, 13)}`;
    }
  };

  // Handle phone number input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    setPhoneNumber(input);
    setRecipientVerified(false);
  };

  // Handle amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
  };

  // Verify recipient account
  const verifyRecipient = () => {
    if (phoneNumber.length < 10 || !selectedWallet) return;
    
    setIsVerifying(true);
    
    // Simulate API call to verify recipient
    setTimeout(() => {
      setRecipientName(
        recentTransfers.find(
          (t) => t.accountNumber.endsWith(phoneNumber.slice(-8)) && t.walletId === selectedWallet
        )?.name || "User " + selectedWallet.toUpperCase()
      );
      setRecipientVerified(true);
      setIsVerifying(false);
    }, 1000);
  };

  // Process transfer
  const processTransfer = () => {
    if (!recipientVerified || !amount || parseInt(amount) <= 0) return;
    
    setIsProcessing(true);
    
    // Simulate API call for processing transfer
    setTimeout(() => {
      // Generate transaction ID
      const txId = `EW${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  // Reset the form
  const resetForm = () => {
    setSelectedWallet(null);
    setPhoneNumber("");
    setAmount("");
    setRecipientVerified(false);
    setRecipientName("");
    setIsSuccess(false);
  };

  // Get wallet data by ID
  const getWalletById = (id: string) => {
    return eWallets.find(wallet => wallet.id === id);
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm font-medium">Memproses...</span>
    </div>
  );

  return (
    <MobileLayout>
      {/* Custom Header */}
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-800 text-white">
        <div className="flex items-center gap-4 px-4 py-3">
          <button 
            onClick={() => navigate("/ppob")} 
            className="rounded-full w-8 h-8 flex items-center justify-center bg-white/20"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">e-Wallet</h1>
            <p className="text-xs text-white/70">Transfer ke e-wallet lainnya</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-4">
          <Card className="bg-white/10 border-0 backdrop-blur-sm text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Saldo Tersedia</p>
              <h2 className="text-2xl font-bold">{formatRupiah(balance)}</h2>
              <p className="text-xs text-white/70 mt-1">
                <span className="inline-flex items-center">
                  <Icons.clock className="h-3 w-3 mr-1" />
                  Terakhir diperbarui: {new Date().toLocaleTimeString("id-ID")}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="transfer" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transfer" className="space-y-4">
            {!isSuccess ? (
              <>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Pilih E-Wallet</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {eWallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                            selectedWallet === wallet.id 
                              ? `border-2 border-primary ${wallet.bgColor}` 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedWallet(wallet.id)}
                        >
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                              selectedWallet === wallet.id ? wallet.bgColor : "bg-gray-100"
                            }`}
                          >
                            {selectedWallet === wallet.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Icons.check className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <img 
                              src={wallet.logo} 
                              alt={wallet.name} 
                              className="w-6 h-6 object-contain" 
                            />
                          </div>
                          <span className="text-xs font-medium">{wallet.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedWallet && (
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                              <Icons.phone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Input
                              id="phoneNumber"
                              className="pl-9"
                              placeholder="Contoh: 081234567890"
                              value={formatPhoneNumber(phoneNumber)}
                              onChange={handlePhoneNumberChange}
                              disabled={recipientVerified || isVerifying}
                            />
                          </div>
                          
                          {recentTransfers.length > 0 && !recipientVerified && (
                            <div className="mt-4">
                              <Label className="text-sm mb-2 block">Tujuan Tersimpan</Label>
                              <div className="space-y-2">
                                {recentTransfers
                                  .filter(t => t.walletId === selectedWallet)
                                  .map((transfer, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                                      onClick={() => {
                                        setPhoneNumber(transfer.accountNumber);
                                        verifyRecipient();
                                      }}
                                    >
                                      <Avatar className="h-9 w-9">
                                        <AvatarFallback 
                                          className={`${getWalletById(transfer.walletId)?.textColor} ${getWalletById(transfer.walletId)?.bgColor}`}
                                        >
                                          {transfer.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{transfer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatPhoneNumber(transfer.accountNumber)}
                                        </p>
                                      </div>
                                      <Badge 
                                        variant="outline" 
                                        className={`ml-auto ${getWalletById(transfer.walletId)?.textColor}`}
                                      >
                                        {getWalletById(transfer.walletId)?.name}
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          
                          {!recipientVerified && phoneNumber.length >= 10 && (
                            <Button 
                              className="w-full mt-2" 
                              onClick={verifyRecipient} 
                              disabled={isVerifying}
                            >
                              {isVerifying ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Memeriksa...</span>
                                </div>
                              ) : "Verifikasi Nomor"}
                            </Button>
                          )}
                          
                          {recipientVerified && (
                            <>
                              <div className="p-3 bg-muted/40 rounded-lg flex items-center gap-3 mt-2">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback 
                                    className={`${getWalletById(selectedWallet)?.textColor} ${getWalletById(selectedWallet)?.bgColor}`}
                                  >
                                    {recipientName.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{recipientName}</p>
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs text-muted-foreground">
                                      {formatPhoneNumber(phoneNumber)}
                                    </p>
                                    <Badge 
                                      variant="outline" 
                                      className={`${getWalletById(selectedWallet)?.textColor} text-xs`}
                                    >
                                      {getWalletById(selectedWallet)?.name}
                                    </Badge>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="ml-auto h-8 px-2"
                                  onClick={() => {
                                    setRecipientVerified(false);
                                    setPhoneNumber("");
                                  }}
                                >
                                  Ubah
                                </Button>
                              </div>
                              
                              <div className="space-y-2 mt-4">
                                <Label htmlFor="amount">Nominal Transfer</Label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">
                                    Rp
                                  </div>
                                  <Input
                                    id="amount"
                                    className="pl-9"
                                    placeholder="0"
                                    value={amount ? parseInt(amount).toLocaleString("id-ID") : ""}
                                    onChange={handleAmountChange}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {[50000, 100000, 200000, 500000].map((value) => (
                                    <Button
                                      key={value}
                                      type="button"
                                      variant="outline"
                                      className="flex-1 min-w-20"
                                      onClick={() => setAmount(value.toString())}
                                    >
                                      {formatRupiah(value)}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full mt-4" 
                                size="lg"
                                disabled={
                                  !amount || 
                                  parseInt(amount) <= 0 || 
                                  parseInt(amount) > balance ||
                                  isProcessing
                                }
                                onClick={processTransfer}
                              >
                                {isProcessing ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Memproses...</span>
                                  </div>
                                ) : "Transfer Sekarang"}
                              </Button>
                              
                              {parseInt(amount) > balance && (
                                <p className="text-xs text-red-500 mt-1">
                                  Saldo Anda tidak mencukupi untuk melakukan transfer ini.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <Card className="border-none shadow-sm">
                <CardContent className="pt-6 px-6 pb-6 flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Icons.check className="h-10 w-10 text-green-600" />
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-1">Transfer Berhasil!</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Dana telah berhasil ditransfer ke {getWalletById(selectedWallet!)?.name}
                  </p>
                  
                  <div className="w-full bg-muted/30 p-4 rounded-lg space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Jumlah</span>
                      <span className="text-sm font-medium">{formatRupiah(parseInt(amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Penerima</span>
                      <span className="text-sm font-medium">{recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">E-Wallet</span>
                      <span className="text-sm font-medium">{getWalletById(selectedWallet!)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nomor Telepon</span>
                      <span className="text-sm font-medium">{formatPhoneNumber(phoneNumber)}</span>
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
                    <Button variant="outline" className="flex-1" onClick={resetForm}>
                      <Icons.arrowRight className="mr-2 h-4 w-4" />
                      Transfer Lagi
                    </Button>
                    <Button className="flex-1" onClick={() => navigate("/ppob")}>
                      Selesai
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <h2 className="text-lg font-medium mb-4">Riwayat Transfer E-Wallet</h2>
                
                <div className="space-y-3">
                  {[
                    {
                      id: "EW20250603001",
                      wallet: "dana",
                      name: "Budi Santoso",
                      phone: "081234567890",
                      amount: 100000,
                      date: new Date(2025, 5, 2)
                    },
                    {
                      id: "EW20250602002",
                      wallet: "gopay",
                      name: "Siti Rahayu",
                      phone: "081387654321",
                      amount: 50000,
                      date: new Date(2025, 5, 1)
                    },
                    {
                      id: "EW20250601003",
                      wallet: "ovo",
                      name: "Ahmad Hidayat",
                      phone: "081598765432",
                      amount: 75000,
                      date: new Date(2025, 5, 1)
                    }
                  ].map((transaction, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${getWalletById(transaction.wallet)?.bgColor}`}
                        >
                          <img 
                            src={getWalletById(transaction.wallet)?.logo} 
                            alt={getWalletById(transaction.wallet)?.name} 
                            className="w-6 h-6 object-contain" 
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{transaction.name}</p>
                            <p className="text-sm font-semibold text-red-600">
                              -{formatRupiah(transaction.amount)}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatPhoneNumber(transaction.phone)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.date.toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">ID: {transaction.id}</span>
                        <Badge 
                          variant="outline"
                          className={getWalletById(transaction.wallet)?.textColor}
                        >
                          {getWalletById(transaction.wallet)?.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default PPOBEWalletPage;
