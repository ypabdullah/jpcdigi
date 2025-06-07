import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Pembayaran Berhasil",
    message: "Pembayaran tagihan PLN sebesar Rp 250.000 telah berhasil.",
    date: "2025-06-02T14:35:00",
    type: "success",
    read: false,
  },
  {
    id: "notif-2",
    title: "Promo Spesial",
    message: "Dapatkan cashback 10% untuk pembelian pulsa min. Rp 50.000.",
    date: "2025-06-02T10:15:00",
    type: "promo",
    read: false,
  },
  {
    id: "notif-3",
    title: "Pembayaran Tertunda",
    message: "Pembayaran BPJS Kesehatan sedang diproses.",
    date: "2025-06-01T18:22:00",
    type: "pending",
    read: true,
  },
  {
    id: "notif-4",
    title: "Transaksi Gagal",
    message: "Pembelian token listrik gagal. Saldo tidak mencukupi.",
    date: "2025-06-01T13:45:00",
    type: "error",
    read: true,
  },
  {
    id: "notif-5",
    title: "Top Up Berhasil",
    message: "Top up saldo PPOB Wallet sebesar Rp 500.000 berhasil.",
    date: "2025-05-31T09:10:00",
    type: "success",
    read: true,
  },
];

type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "success" | "error" | "pending" | "promo";
  read: boolean;
};

interface PPOBNotificationsProps {
  onClose?: () => void;
}

export function PPOBNotifications({ onClose }: PPOBNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate API call to fetch notifications
    const fetchNotifications = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setNotifications(mockNotifications);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({
        ...notif,
        read: true,
      }))
    );
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return `Hari ini, ${date.toLocaleTimeString("id-ID", { 
        hour: "2-digit", 
        minute: "2-digit" 
      })}`;
    } else if (diffDays === 1) {
      return "Kemarin";
    } else if (diffDays < 7) {
      // This week
      return date.toLocaleDateString("id-ID", { weekday: "long" });
    } else {
      // Older
      return date.toLocaleDateString("id-ID", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Icons.check className="h-4 w-4 text-green-500" />;
      case "error":
        return <Icons.flame className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Icons.clock className="h-4 w-4 text-yellow-500" />;
      case "promo":
        return <Icons.ticket className="h-4 w-4 text-purple-500" />;
      default:
        return <Icons.bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Notifikasi</CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="text-xs">
            Semua ({notifications.length})
          </Badge>
          {unreadCount > 0 && (
            <Badge className="text-xs bg-primary">Belum Dibaca ({unreadCount})</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                  !notification.read && "bg-muted/30"
                )}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(notification.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <Badge className="mt-1 bg-primary/20 text-primary hover:bg-primary/30 text-xs" variant="secondary">
                        Baru
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
