import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Icons } from "@/components/Icons";

export function FundTransfer() {
  const [activeTab, setActiveTab] = useState("bank");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [eWalletType, setEWalletType] = useState("");
  const [eWalletNumber, setEWalletNumber] = useState("");
  
  const banks = [
    { id: "bca", name: "BCA" },
    { id: "bni", name: "BNI" },
    { id: "bri", name: "BRI" },
    { id: "mandiri", name: "Mandiri" },
    { id: "cimb", name: "CIMB Niaga" },
    { id: "permata", name: "Permata Bank" },
    { id: "btn", name: "BTN" },
    { id: "danamon", name: "Danamon" }
  ];
  
  const eWallets = [
    { id: "gopay", name: "GoPay" },
    { id: "ovo", name: "OVO" },
    { id: "dana", name: "DANA" },
    { id: "shopeepay", name: "ShopeePay" },
    { id: "linkaja", name: "LinkAja" }
  ];
  
  const handleCheckAccount = () => {
    if (!recipientBank || !recipientAccount) return;
    
    setIsChecking(true);
    
    // Simulate API call to check account
    setTimeout(() => {
      // Dummy response
      setRecipientName("JOHN DOE");
      setIsChecking(false);
    }, 1500);
  };
  
  const handleTransfer = () => {
    setIsLoading(true);
    
    // Simulate transfer process
    setTimeout(() => {
      setIsLoading(false);
      setIsDialogOpen(false);
      
      // Reset form
      setRecipientBank("");
      setRecipientAccount("");
      setRecipientName("");
      setAmount("");
      setNote("");
      setEWalletType("");
      setEWalletNumber("");
      
      // Here would show success notification
    }, 2000);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDialogOpen(true);
  };
  
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="bank">Transfer Bank</TabsTrigger>
          <TabsTrigger value="ewallet">Transfer E-Wallet</TabsTrigger>
        </TabsList>
        
        {/* Bank Transfer Tab */}
        <TabsContent value="bank">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bank Tujuan</label>
              <Select value={recipientBank} onValueChange={setRecipientBank} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bank tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor Rekening</label>
              <div className="flex space-x-2">
                <Input
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  placeholder="Masukkan nomor rekening"
                  required
                  type="number"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCheckAccount}
                  disabled={!recipientBank || !recipientAccount || isChecking}
                >
                  {isChecking ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cek"
                  )}
                </Button>
              </div>
            </div>
            
            {recipientName && (
              <div>
                <label className="text-sm font-medium mb-1 block">Nama Penerima</label>
                <Input value={recipientName} disabled className="bg-muted" />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-1 block">Jumlah Transfer</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masukkan jumlah transfer"
                required
                type="number"
                min="10000"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimal Rp 10.000</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Catatan (Opsional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Masukkan catatan transfer"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">Maksimal 50 karakter</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!recipientBank || !recipientAccount || !recipientName || !amount}
            >
              Lanjutkan Transfer
            </Button>
          </form>
        </TabsContent>
        
        {/* E-Wallet Transfer Tab */}
        <TabsContent value="ewallet">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Jenis E-Wallet</label>
              <Select value={eWalletType} onValueChange={setEWalletType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis e-wallet" />
                </SelectTrigger>
                <SelectContent>
                  {eWallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor Telepon Terdaftar</label>
              <Input
                value={eWalletNumber}
                onChange={(e) => setEWalletNumber(e.target.value)}
                placeholder="Masukkan nomor telepon terdaftar"
                required
                type="tel"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Jumlah Transfer</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masukkan jumlah transfer"
                required
                type="number"
                min="10000"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimal Rp 10.000</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Catatan (Opsional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Masukkan catatan transfer"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">Maksimal 50 karakter</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!eWalletType || !eWalletNumber || !amount}
            >
              Lanjutkan Transfer
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      
      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Transfer</DialogTitle>
            <DialogDescription>
              Pastikan detail transfer sudah benar sebelum melanjutkan
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-lg">Detail Transfer</h4>
              
              {activeTab === "bank" ? (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Tujuan</span>
                    <span>{banks.find(b => b.id === recipientBank)?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nomor Rekening</span>
                    <span>{recipientAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama Penerima</span>
                    <span>{recipientName}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-Wallet</span>
                    <span>{eWallets.find(w => w.id === eWalletType)?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nomor Telepon</span>
                    <span>{eWalletNumber}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 mt-4 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Transfer</span>
                  <span>Rp {parseInt(amount).toLocaleString('id-ID')}</span>
                </div>
                {note && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Catatan</span>
                    <span>{note}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Admin</span>
                  <span>Rp 0</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rp {parseInt(amount).toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleTransfer}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Transfer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
