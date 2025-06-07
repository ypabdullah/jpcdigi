import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// Use the Icons component for all icons
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Sample game data
const popularGames = [
  {
    id: "ml",
    name: "Mobile Legends",
    image: "https://play-lh.googleusercontent.com/ha7AWuJ9nlt3X5OgDI-HZkrZf0TjyuO6j6WnVcjbPHbhTVK9KTbdcKBQUDpzJqdJjA",
    publisher: "Moonton",
    category: "MOBA",
    items: [
      { id: "ml-1", name: "86 Diamonds", price: 22000, originalPrice: 25000, discount: true },
      { id: "ml-2", name: "172 Diamonds", price: 45000, originalPrice: 50000, discount: true },
      { id: "ml-3", name: "257 Diamonds", price: 67000, originalPrice: 75000, discount: true },
      { id: "ml-4", name: "344 Diamonds", price: 89000, originalPrice: 100000, discount: true },
      { id: "ml-5", name: "429 Diamonds", price: 112000, originalPrice: 125000, discount: true },
      { id: "ml-6", name: "514 Diamonds", price: 134000, originalPrice: 150000, discount: true },
      { id: "ml-7", name: "706 Diamonds", price: 179000, originalPrice: 200000, discount: true },
      { id: "ml-8", name: "878 Diamonds", price: 223000, originalPrice: 250000, discount: true },
      { id: "ml-9", name: "963 Diamonds", price: 245000, originalPrice: 275000, discount: true },
      { id: "ml-10", name: "1050 Diamonds", price: 268000, originalPrice: 300000, discount: true },
      { id: "ml-11", name: "Weekly Diamond Pass", price: 28500, originalPrice: 30000, discount: true },
      { id: "ml-12", name: "Starlight Member", price: 149000, originalPrice: 149000, discount: false },
    ]
  },
  {
    id: "ff",
    name: "Free Fire",
    image: "https://play-lh.googleusercontent.com/WWcssdzTZvx7Fc84lfMpZRvTUjqxUcKn3ANF5_XYOegQjbUQQdTmMvB8BtY_8VGcJQ",
    publisher: "Garena",
    category: "Battle Royale",
    items: [
      { id: "ff-1", name: "100 Diamonds", price: 15000, originalPrice: 16000, discount: true },
      { id: "ff-2", name: "210 Diamonds", price: 30000, originalPrice: 32000, discount: true },
      { id: "ff-3", name: "310 Diamonds", price: 45000, originalPrice: 48000, discount: true },
      { id: "ff-4", name: "520 Diamonds", price: 75000, originalPrice: 80000, discount: true },
      { id: "ff-5", name: "1060 Diamonds", price: 150000, originalPrice: 160000, discount: true },
      { id: "ff-6", name: "2180 Diamonds", price: 300000, originalPrice: 320000, discount: true },
      { id: "ff-7", name: "5600 Diamonds", price: 750000, originalPrice: 800000, discount: true },
      { id: "ff-8", name: "Weekly Member", price: 28500, originalPrice: 30000, discount: true },
      { id: "ff-9", name: "Monthly Member", price: 85000, originalPrice: 90000, discount: true },
    ]
  },
  {
    id: "pubg",
    name: "PUBG Mobile",
    image: "https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGKL10-G5UIygxED-WNOc3pg",
    publisher: "Tencent Games",
    category: "Battle Royale",
    items: [
      { id: "pubg-1", name: "60 UC", price: 16000, originalPrice: 18000, discount: true },
      { id: "pubg-2", name: "300 UC", price: 75000, originalPrice: 80000, discount: true },
      { id: "pubg-3", name: "600 UC", price: 150000, originalPrice: 160000, discount: true },
      { id: "pubg-4", name: "1500 UC", price: 375000, originalPrice: 400000, discount: true },
      { id: "pubg-5", name: "3000 UC", price: 750000, originalPrice: 800000, discount: true },
      { id: "pubg-6", name: "6000 UC", price: 1490000, originalPrice: 1600000, discount: true },
      { id: "pubg-7", name: "Royale Pass", price: 140000, originalPrice: 150000, discount: true },
    ]
  },
  {
    id: "genshin",
    name: "Genshin Impact",
    image: "https://play-lh.googleusercontent.com/So91qs_eRRvalz7JtGXvUJ7Nsg-A5Q3LL4_ifmEXNsj28Tj0R7jzMCjzqKYzWrEJC6Y",
    publisher: "miHoYo",
    category: "RPG",
    items: [
      { id: "gi-1", name: "60 Genesis Crystals", price: 16000, originalPrice: 18000, discount: true },
      { id: "gi-2", name: "300+30 Genesis Crystals", price: 80000, originalPrice: 85000, discount: true },
      { id: "gi-3", name: "980+110 Genesis Crystals", price: 250000, originalPrice: 270000, discount: true },
      { id: "gi-4", name: "1980+260 Genesis Crystals", price: 480000, originalPrice: 500000, discount: true },
      { id: "gi-5", name: "3280+600 Genesis Crystals", price: 800000, originalPrice: 850000, discount: true },
      { id: "gi-6", name: "Blessing of the Welkin Moon", price: 75000, originalPrice: 80000, discount: true },
      { id: "gi-7", name: "Battle Pass", price: 140000, originalPrice: 150000, discount: true },
    ]
  },
  {
    id: "valorant",
    name: "Valorant",
    image: "https://play-lh.googleusercontent.com/fzkfPfJPxX0zlNzPYrIMW63AuFWjaCFzzoF-EZzN8_5y8lye0hnHJmBJpz9gy7ICt4Q",
    publisher: "Riot Games",
    category: "FPS",
    items: [
      { id: "val-1", name: "420 Points", price: 50000, originalPrice: 55000, discount: true },
      { id: "val-2", name: "700 Points", price: 80000, originalPrice: 85000, discount: true },
      { id: "val-3", name: "1375 Points", price: 150000, originalPrice: 160000, discount: true },
      { id: "val-4", name: "2400 Points", price: 250000, originalPrice: 265000, discount: true },
      { id: "val-5", name: "4000 Points", price: 400000, originalPrice: 425000, discount: true },
      { id: "val-6", name: "8150 Points", price: 800000, originalPrice: 850000, discount: true },
    ]
  },
  {
    id: "codm",
    name: "Call of Duty Mobile",
    image: "https://play-lh.googleusercontent.com/aUALUc_yfJwV1mZuUHgRyXYXcXUwUfZBZkoXtYzVOoOOFHDlYZhZ8dywSBRWrtBY-8w",
    publisher: "Activision",
    category: "FPS",
    items: [
      { id: "codm-1", name: "26 CP", price: 5000, originalPrice: 5500, discount: true },
      { id: "codm-2", name: "53 CP", price: 10000, originalPrice: 11000, discount: true },
      { id: "codm-3", name: "106 CP", price: 20000, originalPrice: 22000, discount: true },
      { id: "codm-4", name: "264 CP", price: 50000, originalPrice: 55000, discount: true },
      { id: "codm-5", name: "528 CP", price: 100000, originalPrice: 110000, discount: true },
      { id: "codm-6", name: "1056 CP", price: 200000, originalPrice: 220000, discount: true },
      { id: "codm-7", name: "2640 CP", price: 500000, originalPrice: 550000, discount: true },
      { id: "codm-8", name: "5280 CP", price: 1000000, originalPrice: 1100000, discount: true },
    ]
  }
];

// Categories for games
const categories = [
  { id: "all", name: "Semua" },
  { id: "moba", name: "MOBA" },
  { id: "battle-royale", name: "Battle Royale" },
  { id: "rpg", name: "RPG" },
  { id: "fps", name: "FPS" },
  { id: "strategy", name: "Strategy" },
  { id: "casual", name: "Casual" }
];

const PPOBGamesPage = () => {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState<boolean>(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");

  // Get selected game data
  const selectedGame = gameId ? popularGames.find(game => game.id === gameId) : null;

  // Filter games based on search and category
  const filteredGames = popularGames.filter(game => {
    const matchesSearch = searchQuery === "" || 
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      game.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || 
      game.category.toLowerCase() === activeCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Handle game selection
  const handleSelectGame = (id: string) => {
    setGameId(id);
    setUserId("");
    setSelectedItem(null);
  };

  // Handle item selection
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setIsPaymentDialogOpen(true);
  };

  // Process payment
  const handleProcessPayment = () => {
    if (!selectedItem || !selectedGame || !userId) return;
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Generate transaction ID
      const txId = `GM${Date.now().toString().slice(-8)}`;
      setTransactionId(txId);
      
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      setIsSuccessDialogOpen(true);
    }, 2000);
  };

  // Reset after transaction
  const handleCloseSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    setSelectedItem(null);
    setGameId(null);
    setUserId("");
  };

  // Component for showing loading spinner
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm font-medium">Memproses...</span>
    </div>
  );

  return (
    <MobileLayout>
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-600 to-purple-800 text-white">
        <div className="flex items-center gap-4 px-4 py-3">
          <button 
            onClick={() => navigate("/ppob")} 
            className="rounded-full w-8 h-8 flex items-center justify-center bg-white/20"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Top Up Games</h1>
            <p className="text-xs text-white/70">Isi ulang kredit game favoritmu</p>
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Cari game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {!gameId ? (
          <>
            {/* Game Categories */}
            <div className="mb-4 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-2 pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Games Grid */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Game Populer</h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredGames.map((game) => (
                  <Card 
                    key={game.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectGame(game.id)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted flex items-center justify-center">
                        <img
                          src={game.image}
                          alt={game.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <h3 className="font-medium text-sm truncate">{game.name}</h3>
                      <p className="text-xs text-muted-foreground">{game.publisher}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {game.category}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Game Detail */}
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setGameId(null)} 
                className="rounded-full w-8 h-8 flex items-center justify-center bg-muted"
              >
                <Icons.chevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedGame?.image}
                    alt={selectedGame?.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h2 className="font-semibold">{selectedGame?.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedGame?.publisher}</p>
                </div>
              </div>
            </div>

            {/* User ID input */}
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Masukkan User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Pastikan User ID yang kamu masukkan sudah benar
                </p>
              </CardContent>
            </Card>

            {/* Game Items */}
            <h3 className="font-semibold mb-3">Pilih Nominal</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {selectedGame?.items.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                    selectedItem?.id === item.id ? "border-primary border-2" : ""
                  }`}
                  onClick={() => handleSelectItem(item)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <div className="mt-1">
                      <p className="font-semibold text-primary">{formatRupiah(item.price)}</p>
                      {item.discount && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatRupiah(item.originalPrice)}
                        </p>
                      )}
                    </div>
                    {item.discount && (
                      <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100 text-xs" variant="secondary">
                        Hemat {formatRupiah(item.originalPrice - item.price)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={selectedGame?.image} />
                  <AvatarFallback className="rounded-lg bg-primary/20">
                    {selectedGame?.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedGame?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    User ID: {userId}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Item</span>
                  <span className="text-sm font-medium">{selectedItem?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Harga</span>
                  <span className="text-sm font-medium">{selectedItem ? formatRupiah(selectedItem.price) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Biaya Admin</span>
                  <span className="text-sm font-medium">Rp 0</span>
                </div>
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold text-primary">{selectedItem ? formatRupiah(selectedItem.price) : "-"}</span>
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
                <Button className="w-full" onClick={handleProcessPayment} disabled={!userId || !selectedItem}>
                  Bayar Sekarang
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
            
            <h2 className="text-xl font-semibold mb-1">Pembayaran Berhasil!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Item game telah berhasil dibeli
            </p>
            
            <div className="w-full bg-muted/30 p-4 rounded-lg space-y-3 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Game</span>
                <span className="text-sm font-medium">{selectedGame?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-medium">{userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Item</span>
                <span className="text-sm font-medium">{selectedItem?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jumlah</span>
                <span className="text-sm font-medium">{selectedItem ? formatRupiah(selectedItem.price) : "-"}</span>
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
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  setGameId(null);
                }}
              >
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Top Up Lagi
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

export default PPOBGamesPage;
