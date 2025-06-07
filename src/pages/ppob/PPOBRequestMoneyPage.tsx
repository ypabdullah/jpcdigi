import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const PPOBRequestMoneyPage = () => {
  const navigate = useNavigate();
  const [requestAmount, setRequestAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"contacts" | "link" | "qr">("contacts");
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [shareDialog, setShareDialog] = useState(false);
  const [requestLink, setRequestLink] = useState("");

  // Sample contacts (would be fetched from API in real app)
  const contacts = [
    { id: "1", name: "Ahmad Firdaus", phone: "081234567890", image: "/placeholder.svg" },
    { id: "2", name: "Budi Santoso", phone: "081298765432", image: "/placeholder.svg" },
    { id: "3", name: "Citra Dewi", phone: "081345678901", image: "/placeholder.svg" },
    { id: "4", name: "Doni Prasetya", phone: "081456789012", image: "/placeholder.svg" }
  ];
  
  // Format currency for display using formatRupiah utility
  const formatDisplayAmount = (amount: string) => {
    const value = amount.replace(/\D/g, "");
    if (value === "") {
      return "";
    }
    // Use formatRupiah but without the 'Rp' prefix for display in the input
    return new Intl.NumberFormat("id-ID").format(parseInt(value));
  };

  // Handle amount input changes with formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value === "") {
      setRequestAmount("");
      return;
    }
    setRequestAmount(new Intl.NumberFormat("id-ID").format(parseInt(value)));
  };
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm font-medium">Memproses...</span>
    </div>
  );

  // Handle request submission
  const handleRequestMoney = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      const reqId = `REQ${Date.now().toString().slice(-8)}`;
      setRequestId(reqId);
      
      // Create request link - in real app this would be a proper deep link
      setRequestLink(`https://jpcdigi.com/ppob/pay-request/${reqId}`);
      
      setIsProcessing(false);
      setRequestSuccess(true);
      
      // Reset after some time
      setTimeout(() => {
        if (activeTab === "link" || activeTab === "qr") {
          setShareDialog(true);
        }
      }, 1500);
    }, 1500);
  };

  return (
    <MobileLayout>
      {/* Custom Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <button 
            onClick={() => navigate("/ppob/dashboard")} 
            className="rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Minta Dana</h1>
            <p className="text-xs text-muted-foreground">Minta dana dari pengguna lain</p>
          </div>
          <div className="ml-auto rounded-full w-8 h-8 flex items-center justify-center bg-white shadow-sm">
            <Icons.file className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        {requestSuccess ? (
          <Card className="border-none shadow-sm mb-6">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Icons.check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-1">Permintaan Terkirim!</h2>
              <p className="text-muted-foreground mb-4">
                Permintaan dana telah dikirim dan menunggu pembayaran
              </p>

              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-semibold">Rp {requestAmount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Tujuan</span>
                  <span className="font-semibold">{phoneNumber || "Link Pembayaran"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Permintaan</span>
                  <span className="font-semibold">{requestId}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex justify-center items-center"
                  onClick={() => navigate("/ppob/history")}
                >
                  <Icons.arrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Beranda
                </Button>
                <Button 
                  className="w-full flex justify-center items-center"
                  onClick={() => setShareDialog(true)}
                >
                  <Icons.share className="mr-2 h-4 w-4" />
                  Bagikan Link Permintaan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-sm mb-6">
              <CardContent className="pt-6">
                <form onSubmit={handleRequestMoney}>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-sm p-5 mb-2">
                      <div className="text-center">
                        <Label htmlFor="amount" className="text-muted-foreground text-xs font-medium">JUMLAH YANG DIMINTA</Label>
                        <div className="relative mt-3 mb-2">
                          <div className="flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary mr-1">Rp</span>
                            <Input
                              id="amount"
                              placeholder="0"
                              className="text-3xl font-bold text-center border-none shadow-none focus-visible:ring-0 w-[60%] h-14 bg-transparent px-0"
                              value={requestAmount}
                              onChange={handleAmountChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mx-4">
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Min: Rp10.000</Badge>
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Maks: Rp10.000.000</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Catatan (Opsional)</Label>
                      <Input
                        id="notes"
                        placeholder="Contoh: Bayar makan siang"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contacts">Kontak</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="contacts" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="phone" className="font-medium">Nomor Telepon</Label>
                    <span className="text-xs text-primary">Semua Kontak</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Icons.phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="phone"
                      placeholder="Contoh: 081234567890"
                      className="pl-9 bg-muted/30"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nomor telepon penerima permintaan dana
                  </p>
                </div>
                
                <div className="bg-muted/20 rounded-lg p-3 mb-4">
                  <h3 className="text-sm font-medium mb-2">Nomor Tersimpan</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {contacts.map((contact) => (
                      <div 
                        key={contact.id}
                        onClick={() => setPhoneNumber(contact.phone)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={contact.image} alt={contact.name} />
                          <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center">
                          {phoneNumber === contact.phone && (
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!requestAmount || !phoneNumber || isProcessing}
                  onClick={handleRequestMoney}
                >
                  {isProcessing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : "Kirim Permintaan"}
                </Button>
              </TabsContent>
              
              <TabsContent value="link" className="space-y-4 pt-4">
                <div className="bg-muted/30 p-4 rounded-lg text-center space-y-2">
                  <Icons.link className="h-12 w-12 mx-auto text-primary/50" />
                  <h3 className="font-medium">Bagikan Link Permintaan</h3>
                  <p className="text-sm text-muted-foreground">
                    Buat link yang dapat dibagikan untuk menerima pembayaran
                  </p>
                  
                  <Button 
                    className="w-full" 
                    disabled={!requestAmount || isProcessing}
                    onClick={handleRequestMoney}
                  >
                    {isProcessing ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : "Buat Link Pembayaran"}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="qr" className="space-y-4 pt-4">
                <div className="bg-muted/30 p-4 rounded-lg text-center space-y-2">
                  <Icons.qrCode className="h-12 w-12 mx-auto text-primary/50" />
                  <h3 className="font-medium">Buat QR Code Pembayaran</h3>
                  <p className="text-sm text-muted-foreground">
                    Buat kode QR yang dapat dipindai untuk menerima pembayaran
                  </p>
                  
                  <Button 
                    className="w-full" 
                    disabled={!requestAmount || isProcessing}
                    onClick={handleRequestMoney}
                  >
                    {isProcessing ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : "Buat QR Code Pembayaran"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {/* Share Dialog */}
        <Dialog open={shareDialog} onOpenChange={setShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bagikan Permintaan</DialogTitle>
              <DialogDescription>
                Bagikan link atau QR code permintaan dana kepada orang lain
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {activeTab === "qr" ? (
                <div className="flex justify-center">
                  <div className="p-4 border-2 border-dashed border-muted-foreground/50 rounded-lg bg-white">
                    <QRCode value={requestLink} size={180} />
                    <p className="text-xs text-center mt-2">
                      Rp {requestAmount}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Link Permintaan</Label>
                  <div className="flex">
                    <Input
                      value={requestLink}
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button
                      className="rounded-l-none"
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(requestLink);
                        // Show toast or notification
                        alert("Link permintaan disalin!");
                      }}
                    >
                      <Icons.copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Bagikan ke</Label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: "messageSquare", name: "WhatsApp", color: "text-green-600" },
                    { icon: "mail", name: "Email", color: "text-blue-600" },
                    { icon: "wifi", name: "Facebook", color: "text-blue-800" },
                    { icon: "copy", name: "Salin", color: "text-gray-600" }
                  ].map((item, index) => {
                    const IconComponent = Icons[item.icon as keyof typeof Icons];
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-3 flex flex-col items-center"
                      >
                        <IconComponent className={`h-5 w-5 mb-1 ${item.color}`} />
                        <span className="text-xs">{item.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShareDialog(false);
                  navigate("/ppob/history");
                }}
              >
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default PPOBRequestMoneyPage;
