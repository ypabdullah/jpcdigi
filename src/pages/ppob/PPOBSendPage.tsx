import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/Icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock saved accounts data
const savedAccounts = [
  {
    id: "acc1",
    name: "Yoga Prasetya",
    bank: "Seabank Indonesia",
    accountNumber: "1234567890",
    isRecent: true
  },
  {
    id: "acc2",
    name: "Budi Santoso",
    bank: "Bank BCA",
    accountNumber: "9876543210",
    isRecent: false
  },
  {
    id: "acc3",
    name: "Siti Nurhaliza",
    bank: "Bank Mandiri",
    accountNumber: "5678901234",
    isRecent: true
  }
];

// List of banks
const banks = [
  "Bank BCA",
  "Bank Mandiri",
  "Bank BNI",
  "Bank BRI",
  "Bank CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Seabank Indonesia",
  "Bank Syariah Indonesia",
  "Bank Jago"
];

export default function PPOBSendPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("transfer");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
  };
  
  const handleAccountSelect = (account: typeof savedAccounts[0]) => {
    setAccountNumber(account.accountNumber);
    setSelectedBank(account.bank);
    setRecipientName(account.name);
  };
  
  const handleContinue = () => {
    // Validation
    if (!amount || parseInt(amount) < 10000) {
      alert("Minimal transfer Rp 10.000");
      return;
    }
    
    if (!accountNumber || !selectedBank) {
      alert("Mohon lengkapi data rekening tujuan");
      return;
    }
    
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmTransfer = () => {
    setIsConfirmDialogOpen(false);
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccessDialogOpen(true);
    }, 2000);
  };
  
  const formatDisplayAmount = () => {
    if (!amount) return "";
    return formatRupiah(parseInt(amount));
  };
  
  const handleClose = () => {
    setIsSuccessDialogOpen(false);
    navigate("/ppob/activity");
  };

  return (
    <MobileLayout>
      <Helmet>
        <title>Kirim Uang - JPC Digi</title>
      </Helmet>
      
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-primary text-white p-4">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white mr-2 p-0" 
              onClick={() => navigate("/ppob")}
            >
              <Icons.chevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Kirim Uang</h1>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="transfer" className="w-full" onValueChange={setActiveTab}>
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transfer">Transfer Bank</TabsTrigger>
              <TabsTrigger value="ewallet">E-Wallet</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="transfer" className="p-4">
            <div className="space-y-4">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    className="pl-10"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500">Minimal Rp 10.000</p>
              </div>
              
              {/* Bank Selection */}
              <div className="space-y-2">
                <Label htmlFor="bank">Bank Tujuan</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Pilih bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Masukkan nomor rekening"
                />
              </div>
              
              {/* Recipient Name */}
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nama Penerima</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama akan terisi otomatis"
                  disabled={!accountNumber || accountNumber.length < 8}
                />
              </div>
              
              {/* Saved Accounts */}
              {savedAccounts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Rekening Tersimpan</h3>
                  <div className="space-y-2">
                    {savedAccounts.map((account) => (
                      <div 
                        key={account.id}
                        className="border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                        onClick={() => handleAccountSelect(account)}
                      >
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-gray-500">
                            {account.bank} • {account.accountNumber}
                          </p>
                        </div>
                        {account.isRecent && (
                          <Badge variant="outline" className="text-xs">
                            Baru
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="ewallet" className="p-4">
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Icons.wallet className="h-12 w-12 mb-2 opacity-40" />
              <p>Fitur E-Wallet sedang dalam pengembangan</p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Continue Button */}
        <div className="mt-auto p-4 border-t">
          <Button 
            className="w-full" 
            size="lg"
            disabled={!amount || !accountNumber || !selectedBank || activeTab !== "transfer"}
            onClick={handleContinue}
          >
            Lanjutkan
          </Button>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-center text-2xl font-bold">{formatDisplayAmount()}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-500">Bank</p>
                <p className="font-medium">{selectedBank}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-500">Nomor Rekening</p>
                <p className="font-medium">{accountNumber}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-500">Nama Penerima</p>
                <p className="font-medium">{recipientName}</p>
              </div>
              <Separator />
              <div className="flex justify-between">
                <p className="text-gray-500">Biaya Admin</p>
                <p className="font-medium">Gratis</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Total</p>
                <p className="font-bold">{formatDisplayAmount()}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleConfirmTransfer}>
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Processing Dialog */}
      {isProcessing && (
        <Dialog open={true}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Memproses Transaksi</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8">
              <Icons.spinner className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Mohon tunggu, transaksi sedang diproses...</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Berhasil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Icons.check className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-center text-2xl font-bold">{formatDisplayAmount()}</p>
              <p className="text-gray-500">berhasil ditransfer ke</p>
              <p className="font-medium">{recipientName}</p>
              <p className="text-sm text-gray-500">{selectedBank} • {accountNumber}</p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleClose}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
