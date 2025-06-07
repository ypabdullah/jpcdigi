import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Reward tiers
const rewardTiers = [
  { 
    id: 1, 
    minInvites: 1, 
    reward: 10000, 
    name: "Bronze", 
    color: "bg-amber-100",
    iconColor: "text-amber-600",
    description: "Undang 1 teman dan dapatkan Rp10.000" 
  },
  { 
    id: 2, 
    minInvites: 5, 
    reward: 75000, 
    name: "Silver", 
    color: "bg-gray-100",
    iconColor: "text-gray-500",
    description: "Undang 5 teman dan dapatkan Rp75.000" 
  },
  { 
    id: 3, 
    minInvites: 10, 
    reward: 200000, 
    name: "Gold", 
    color: "bg-yellow-100",
    iconColor: "text-yellow-600",
    description: "Undang 10 teman dan dapatkan Rp200.000" 
  },
  { 
    id: 4, 
    minInvites: 25, 
    reward: 750000, 
    name: "Platinum", 
    color: "bg-indigo-100",
    iconColor: "text-indigo-600",
    description: "Undang 25 teman dan dapatkan Rp750.000" 
  },
];

// Friends who have joined
const joinedFriends = [
  { id: 1, name: "Bambang Sutrisno", date: "1 Juni 2025", phone: "08123456789", status: "completed" },
  { id: 2, name: "Dian Sastro", date: "28 Mei 2025", phone: "08234567890", status: "completed" },
  { id: 3, name: "Rizky Febian", date: "25 Mei 2025", phone: "08345678901", status: "completed" },
];

const PPOBUndangTemanPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("undang");
  const [referralCode, setReferralCode] = useState("JPCDIGI123");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [successDialog, setSuccessDialog] = useState(false);
  const [copiedDialog, setCopiedDialog] = useState(false);
  
  // Stats
  const totalInvited = joinedFriends.length;
  const currentTier = rewardTiers.filter(tier => tier.minInvites <= totalInvited).pop();
  const nextTier = rewardTiers.find(tier => tier.minInvites > totalInvited);
  const progressPercentage = nextTier 
    ? (totalInvited / nextTier.minInvites) * 100
    : 100;

  // Copy referral code
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedDialog(true);
    setTimeout(() => setCopiedDialog(false), 2000);
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `Hai! Ayo bergabung dengan JPC Digi dan dapatkan berbagai kemudahan transaksi digital. Daftar dengan kode referral saya: ${referralCode} https://jpcdigi.com/register?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Invite friend
  const inviteFriend = () => {
    if (!phoneNumber || phoneNumber.length < 10) return;
    setSuccessDialog(true);
    setPhoneNumber("");
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate("/ppob/all-services")}
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Undang Teman</h1>
            <p className="text-xs text-muted-foreground">Dapatkan reward dengan mengundang teman</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-primary/90 to-primary">
          <CardContent className="p-4 text-white">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xl font-bold">
                  {totalInvited} Teman
                </h3>
                <p className="text-xs opacity-80">telah bergabung dari undangan Anda</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Icons.users className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {currentTier?.name}</span>
                {nextTier ? (
                  <span>{totalInvited}/{nextTier.minInvites} menuju {nextTier.name}</span>
                ) : (
                  <span>Level Maksimum</span>
                )}
              </div>
              
              <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full" 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }} 
                />
              </div>
              
              <p className="text-xs opacity-80">
                {nextTier 
                  ? `Undang ${nextTier.minInvites - totalInvited} teman lagi untuk mencapai level ${nextTier.name} dan dapatkan ${formatRupiah(nextTier.reward)}`
                  : "Anda telah mencapai level tertinggi!"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="undang">Undang Teman</TabsTrigger>
                <TabsTrigger value="riwayat">Riwayat Undangan</TabsTrigger>
              </TabsList>

              <TabsContent value="undang" className="space-y-4 mt-2">
                {/* Referral Code */}
                <div className="space-y-3">
                  <Label>Kode Referral Anda</Label>
                  <div className="flex">
                    <div className="flex-1 bg-muted/50 p-3 rounded-l-md border border-r-0 border-gray-200 font-mono font-semibold text-center">
                      {referralCode}
                    </div>
                    <Button 
                      variant="secondary" 
                      className="rounded-l-none"
                      onClick={copyReferralCode}
                    >
                      <Icons.copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Bagikan kode referral Anda kepada teman untuk mendapatkan reward
                  </p>
                </div>
                
                {/* Share Options */}
                <div className="space-y-3">
                  <Label>Undang via</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="h-auto py-3"
                      onClick={shareViaWhatsApp}
                    >
                      <Icons.mail className="h-5 w-5 mr-2" />
                      WhatsApp
                    </Button>
                    <Button 
                      className="h-auto py-3"
                      variant="outline"
                      onClick={copyReferralCode}
                    >
                      <Icons.copy className="h-5 w-5 mr-2" />
                      Salin Link
                    </Button>
                  </div>
                </div>
                
                {/* Direct Invite */}
                <div className="space-y-3 pt-2">
                  <Label>Undang dengan nomor telepon</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        className="h-12 pl-12"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Contoh: 081234567890"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Icons.phone className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      disabled={!phoneNumber || phoneNumber.length < 10}
                      onClick={inviteFriend}
                    >
                      Kirim Undangan
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="riwayat" className="space-y-4 mt-2">
                <Label>Teman yang telah bergabung</Label>
                
                {joinedFriends.length > 0 ? (
                  <div className="space-y-3">
                    {joinedFriends.map((friend) => (
                      <div 
                        key={friend.id}
                        className="border border-gray-200 rounded-lg p-3 flex justify-between"
                      >
                        <div>
                          <div className="font-medium">{friend.name}</div>
                          <div className="text-xs text-muted-foreground">{friend.phone}</div>
                          <div className="text-xs text-muted-foreground">Bergabung: {friend.date}</div>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Icons.check className="h-3 w-3 mr-1" />
                            Bergabung
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                      <Icons.users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg">Belum ada teman yang bergabung</h3>
                    <p className="text-sm text-muted-foreground">
                      Mulai undang teman Anda sekarang!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Reward Tiers */}
        <div className="space-y-3">
          <Label className="text-base font-medium block">Reward Level</Label>
          
          {rewardTiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "border rounded-lg p-4 flex items-center gap-3",
                totalInvited >= tier.minInvites ? "border-primary bg-primary/5" : "border-gray-200"
              )}
            >
              <div className={`h-12 w-12 rounded-full ${tier.color} flex items-center justify-center`}>
                <Icons.package className={`h-6 w-6 ${tier.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{tier.name}</h3>
                  <span className="font-bold text-amber-500">{formatRupiah(tier.reward)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
                
                {totalInvited >= tier.minInvites && (
                  <span className="text-xs font-medium text-green-600 flex items-center mt-1">
                    <Icons.check className="h-3 w-3 mr-1" />
                    Level tercapai
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Undangan Terkirim!</DialogTitle>
            <DialogDescription className="text-center">
              Undangan telah terkirim ke nomor yang Anda masukkan
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Icons.check className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <p className="text-center text-sm mb-4">
            Teman Anda akan menerima SMS dengan link dan kode referral Anda.
            Anda akan mendapatkan reward setelah teman Anda bergabung dan melakukan transaksi pertama.
          </p>
          
          <Button 
            className="w-full" 
            onClick={() => setSuccessDialog(false)}
          >
            Kembali
          </Button>
        </DialogContent>
      </Dialog>

      {/* Copied Toast */}
      <Dialog open={copiedDialog} onOpenChange={setCopiedDialog}>
        <DialogContent className="sm:max-w-[300px] p-0 bg-gray-800 text-white">
          <div className="p-3 flex items-center">
            <Icons.check className="h-5 w-5 mr-2" />
            <span>Kode referral disalin!</span>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PPOBUndangTemanPage;
