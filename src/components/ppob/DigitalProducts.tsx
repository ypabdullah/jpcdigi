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
import { Icons } from "@/components/Icons";

type ProductType = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export function DigitalProducts() {
  const [activeTab, setActiveTab] = useState("pulsa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gameId, setGameId] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dummy product data
  const pulsaProducts: ProductType[] = [
    { id: "p1", name: "5.000", price: 6000, description: "Pulsa Rp 5.000" },
    { id: "p2", name: "10.000", price: 11000, description: "Pulsa Rp 10.000" },
    { id: "p3", name: "20.000", price: 21000, description: "Pulsa Rp 20.000" },
    { id: "p4", name: "25.000", price: 26000, description: "Pulsa Rp 25.000" },
    { id: "p5", name: "50.000", price: 51000, description: "Pulsa Rp 50.000" },
    { id: "p6", name: "100.000", price: 100000, description: "Pulsa Rp 100.000" }
  ];
  
  const dataProducts: ProductType[] = [
    { id: "d1", name: "2GB 7 Hari", price: 15000, description: "Paket Data 2GB berlaku 7 hari" },
    { id: "d2", name: "4GB 7 Hari", price: 25000, description: "Paket Data 4GB berlaku 7 hari" },
    { id: "d3", name: "8GB 30 Hari", price: 50000, description: "Paket Data 8GB berlaku 30 hari" },
    { id: "d4", name: "15GB 30 Hari", price: 80000, description: "Paket Data 15GB berlaku 30 hari" },
    { id: "d5", name: "30GB 30 Hari", price: 120000, description: "Paket Data 30GB berlaku 30 hari" }
  ];
  
  const tokenProducts: ProductType[] = [
    { id: "t1", name: "20.000", price: 21000, description: "Token Listrik Rp 20.000" },
    { id: "t2", name: "50.000", price: 51000, description: "Token Listrik Rp 50.000" },
    { id: "t3", name: "100.000", price: 101000, description: "Token Listrik Rp 100.000" },
    { id: "t4", name: "200.000", price: 201000, description: "Token Listrik Rp 200.000" },
    { id: "t5", name: "500.000", price: 501000, description: "Token Listrik Rp 500.000" },
    { id: "t6", name: "1.000.000", price: 1001000, description: "Token Listrik Rp 1.000.000" }
  ];
  
  const gameVouchers: ProductType[] = [
    { id: "g1", name: "Mobile Legends: 86 Diamonds", price: 22000, description: "86 Diamonds Mobile Legends" },
    { id: "g2", name: "Mobile Legends: 172 Diamonds", price: 44000, description: "172 Diamonds Mobile Legends" },
    { id: "g3", name: "PUBG Mobile: 131 UC", price: 25000, description: "131 UC PUBG Mobile" },
    { id: "g4", name: "PUBG Mobile: 263 UC", price: 50000, description: "263 UC PUBG Mobile" },
    { id: "g5", name: "Free Fire: 140 Diamonds", price: 20000, description: "140 Diamonds Free Fire" },
    { id: "g6", name: "Free Fire: 355 Diamonds", price: 50000, description: "355 Diamonds Free Fire" }
  ];
  
  const emoney: ProductType[] = [
    { id: "e1", name: "GoPay Rp 50.000", price: 51000, description: "Top up GoPay Rp 50.000" },
    { id: "e2", name: "GoPay Rp 100.000", price: 101000, description: "Top up GoPay Rp 100.000" },
    { id: "e3", name: "OVO Rp 50.000", price: 51000, description: "Top up OVO Rp 50.000" },
    { id: "e4", name: "OVO Rp 100.000", price: 101000, description: "Top up OVO Rp 100.000" },
    { id: "e5", name: "DANA Rp 50.000", price: 51000, description: "Top up DANA Rp 50.000" },
    { id: "e6", name: "DANA Rp 100.000", price: 101000, description: "Top up DANA Rp 100.000" },
    { id: "e7", name: "ShopeePay Rp 50.000", price: 51000, description: "Top up ShopeePay Rp 50.000" },
    { id: "e8", name: "ShopeePay Rp 100.000", price: 101000, description: "Top up ShopeePay Rp 100.000" }
  ];
  
  const operators = [
    { id: "telkomsel", name: "Telkomsel" },
    { id: "indosat", name: "Indosat Ooredoo" },
    { id: "xl", name: "XL Axiata" },
    { id: "tri", name: "3 (Tri)" },
    { id: "smartfren", name: "Smartfren" },
    { id: "axis", name: "AXIS" }
  ];
  
  const games = [
    { id: "ml", name: "Mobile Legends" },
    { id: "pubgm", name: "PUBG Mobile" },
    { id: "ff", name: "Free Fire" },
    { id: "genshin", name: "Genshin Impact" },
    { id: "valorant", name: "Valorant" },
    { id: "ragnarok", name: "Ragnarok M" }
  ];
  
  const handleProductSelect = (product: ProductType) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };
  
  const handlePayment = () => {
    setIsLoading(true);
    
    // Simulate payment process
    setTimeout(() => {
      setIsLoading(false);
      setIsDialogOpen(false);
      setSelectedProduct(null);
      setPhoneNumber("");
      setGameId("");
      
      // Here would show success notification
    }, 2000);
  };
  
  const renderProductList = (products: ProductType[]) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleProductSelect(product)}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-primary font-bold">Rp {product.price.toLocaleString('id-ID')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="pulsa">Pulsa</TabsTrigger>
          <TabsTrigger value="data">Paket Data</TabsTrigger>
          <TabsTrigger value="token">Token Listrik</TabsTrigger>
          <TabsTrigger value="game">Voucher Game</TabsTrigger>
          <TabsTrigger value="emoney">E-Money</TabsTrigger>
        </TabsList>
        
        {/* Pulsa Tab */}
        <TabsContent value="pulsa">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor Telepon</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Masukkan nomor telepon"
                type="tel"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedOperator && (
              <div className="mt-4">
                <h3 className="font-medium mb-3">Pilih Nominal</h3>
                {renderProductList(pulsaProducts)}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Paket Data Tab */}
        <TabsContent value="data">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor Telepon</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Masukkan nomor telepon"
                type="tel"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Operator</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedOperator && (
              <div className="mt-4">
                <h3 className="font-medium mb-3">Pilih Paket Data</h3>
                {renderProductList(dataProducts)}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Token Listrik Tab */}
        <TabsContent value="token">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor Meter/ID Pelanggan</label>
              <Input
                placeholder="Masukkan nomor meter atau ID pelanggan"
              />
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-3">Pilih Nominal</h3>
              {renderProductList(tokenProducts)}
            </div>
          </div>
        </TabsContent>
        
        {/* Voucher Game Tab */}
        <TabsContent value="game">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Game</label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedGame && (
              <div>
                <label className="text-sm font-medium mb-1 block">ID Game / Server ID</label>
                <Input
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="Masukkan ID Game atau Server ID"
                />
              </div>
            )}
            
            {selectedGame && gameId && (
              <div className="mt-4">
                <h3 className="font-medium mb-3">Pilih Nominal</h3>
                {renderProductList(gameVouchers)}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* E-Money Tab */}
        <TabsContent value="emoney">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nomor Telepon</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Masukkan nomor telepon terdaftar"
                type="tel"
              />
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-3">Pilih E-Money</h3>
              {renderProductList(emoney)}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Product Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembelian</DialogTitle>
            <DialogDescription>
              Pastikan detail pembelian sudah benar sebelum melanjutkan
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="py-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg">{selectedProduct.description}</h4>
                
                {activeTab === "pulsa" || activeTab === "data" || activeTab === "emoney" ? (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Nomor Telepon:</p>
                    <p className="font-medium">{phoneNumber || "-"}</p>
                  </div>
                ) : activeTab === "game" ? (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">ID Game:</p>
                    <p className="font-medium">{gameId || "-"}</p>
                  </div>
                ) : null}
                
                <div className="space-y-2 mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga</span>
                    <span>Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total Pembayaran</span>
                    <span>Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handlePayment}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
