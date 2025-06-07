import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, Clock, CalendarDays, Loader2, ShoppingBag } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/utils";

// Tipe data untuk pesanan
interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  shipping_address_id: string;
  shipping_id?: string;
  shipping_method_id?: string;
  shipping_cost?: number;
  payment_details?: string;
  // Lainnya
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOrders();
  }, [user]);
  
  // Format tanggal dengan format Indonesia
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  
  // Mendapatkan badge berdasarkan status pesanan
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Menunggu Pembayaran</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Diproses</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Dikirim</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Diterima</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Dibatalkan</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Terjemahkan metode pembayaran ke bahasa Indonesia
  const translatePaymentMethod = (method: string) => {
    switch (method) {
      case "bank-transfer":
        return "Transfer Bank";
      case "cash-on-delivery":
        return "Bayar di Tempat (COD)";
      case "e-wallet":
        return "E-Wallet";
      case "credit-card":
        return "Kartu Kredit";
      default:
        return method;
    }
  };
  
  return (
    <MobileLayout>
      <div className="p-4 flex items-center shadow-sm mb-2">
        <Link to="/" className="text-charcoal-600 mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold flex-1">Daftar Pesanan</h1>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-flame-500 mb-2" />
            <p className="text-muted-foreground">Memuat daftar pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Belum Ada Pesanan</h2>
            <p className="text-muted-foreground mb-4">
              Anda belum memiliki pesanan. Mulailah berbelanja untuk melihat pesanan Anda di sini.
            </p>
            <Button asChild className="bg-flame-500 hover:bg-flame-600">
              <Link to="/">Mulai Belanja</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link to={`/order/${order.id}`} key={order.id}>
                <Card className="hover:border-flame-200 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-flame-500 mr-2" />
                        <span className="font-medium">#{order.id.substring(0, 8)}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          Tanggal
                        </div>
                        <div className="text-sm">{formatDate(order.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Metode Pembayaran</div>
                        <div className="text-sm">{translatePaymentMethod(order.payment_method)}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {order.payment_status === "paid" ? "Sudah Dibayar" : "Menunggu Pembayaran"}
                      </div>
                      <div className="font-medium text-flame-700">{formatRupiah(order.total)}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
