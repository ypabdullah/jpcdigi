import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Icons } from "@/components/Icons";

type BillCategory = {
  id: string;
  name: string;
  icon: keyof typeof Icons;
  placeholder: string;
  description: string;
};

export function BillPayment() {
  const [selectedBill, setSelectedBill] = useState<BillCategory | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [billDetail, setBillDetail] = useState<any>(null);

  const billCategories: BillCategory[] = [
    { 
      id: "electricity", 
      name: "Listrik PLN", 
      icon: "zap",
      placeholder: "Nomor Meter/ID Pelanggan", 
      description: "Bayar tagihan listrik PLN pascabayar atau beli token listrik prabayar"
    },
    { 
      id: "water", 
      name: "PDAM", 
      icon: "droplet",
      placeholder: "Nomor Pelanggan PDAM", 
      description: "Bayar tagihan air PDAM di berbagai wilayah Indonesia"
    },
    { 
      id: "phone", 
      name: "Telepon", 
      icon: "phone",
      placeholder: "Nomor Telepon", 
      description: "Bayar tagihan telepon rumah Telkom"
    },
    { 
      id: "internet", 
      name: "Internet", 
      icon: "wifi",
      placeholder: "Nomor Pelanggan", 
      description: "Bayar tagihan IndiHome, FirstMedia, dan layanan internet lainnya"
    },
    { 
      id: "tv", 
      name: "TV Kabel", 
      icon: "tv",
      placeholder: "Nomor Pelanggan", 
      description: "Bayar tagihan MNC Vision, Transvision, dan TV kabel lainnya"
    },
    { 
      id: "bpjs", 
      name: "BPJS", 
      icon: "heart",
      placeholder: "Nomor VA/Kartu BPJS", 
      description: "Bayar iuran BPJS Kesehatan & BPJS Ketenagakerjaan"
    },
    { 
      id: "loan", 
      name: "Angsuran Kredit", 
      icon: "creditCard",
      placeholder: "Nomor Kontrak", 
      description: "Bayar angsuran multifinance seperti Adira, FIF, WOM, dll"
    },
    { 
      id: "tax", 
      name: "Pajak", 
      icon: "file",
      placeholder: "Nomor Objek Pajak", 
      description: "Bayar PBB, pajak kendaraan & pajak lainnya"
    },
    { 
      id: "gas", 
      name: "Gas Negara", 
      icon: "flame",
      placeholder: "Nomor Pelanggan PGN", 
      description: "Bayar tagihan Gas PGN (Perusahaan Gas Negara)"
    },
  ];

  const handleBillSelect = (bill: BillCategory) => {
    setSelectedBill(bill);
    setCustomerId("");
    setBillDetail(null);
    setIsDialogOpen(true);
  };

  const handleCheckBill = () => {
    if (!customerId || !selectedBill) return;
    
    setIsLoading(true);
    
    // Simulate API call to check bill
    setTimeout(() => {
      // Dummy bill details
      setBillDetail({
        customerName: "John Doe",
        billPeriod: "Juni 2025",
        amount: Math.floor(Math.random() * 1000000) + 50000,
        admin: 2500,
        dueDate: "30 Juni 2025"
      });
      
      setIsLoading(false);
    }, 1500);
  };

  const handlePayBill = () => {
    setIsLoading(true);
    
    // Simulate payment process
    setTimeout(() => {
      setIsLoading(false);
      setIsDialogOpen(false);
      
      // Reset form
      setCustomerId("");
      setBillDetail(null);
      
      // Here would show a success notification
    }, 2000);
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {billCategories.map((bill) => {
          const IconComponent = Icons[bill.icon];
          return (
            <Card 
              key={bill.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleBillSelect(bill)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">{bill.name}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bill Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBill ? `Bayar ${selectedBill.name}` : "Bayar Tagihan"}
            </DialogTitle>
            <DialogDescription>
              {selectedBill?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {selectedBill?.placeholder}
              </label>
              <Input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder={selectedBill?.placeholder}
                disabled={isLoading || !!billDetail}
              />
              {!billDetail && (
                <Button 
                  className="w-full mt-2" 
                  onClick={handleCheckBill}
                  disabled={!customerId || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    "Cek Tagihan"
                  )}
                </Button>
              )}
            </div>
            
            {billDetail && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg">{billDetail.customerName}</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periode</span>
                    <span>{billDetail.billPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jatuh Tempo</span>
                    <span>{billDetail.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nominal Tagihan</span>
                    <span>Rp {billDetail.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya Admin</span>
                    <span>Rp {billDetail.admin.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total Pembayaran</span>
                    <span>Rp {(billDetail.amount + billDetail.admin).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handlePayBill}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Bayar Sekarang"
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
