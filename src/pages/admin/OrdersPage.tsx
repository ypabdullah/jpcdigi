import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sendOrderNotificationToAdmins } from "@/integrations/firebase/notification-service";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, Address, ShippingMethod, Voucher } from "@/data/models";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import { Search, Edit, Eye, Loader, Receipt, Download, Loader2, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define form schema
const formSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "canceled"]),
  tracking_number: z.string().optional()
});

// Styling untuk receipt
const receiptStyles = {
  receipt: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    lineHeight: "1.4",
    color: "#333",
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
  },
  receiptHeader: {
    textAlign: "center" as const,
    marginBottom: "1rem"
  },
  receiptTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "0.5rem"
  },
  receiptStoreInfo: {
    fontSize: "0.875rem",
    color: "#555",
    marginBottom: "0.5rem"
  },
  receiptBorder: {
    borderTop: "1px dashed #ccc",
    margin: "0.5rem 0"
  },
  receiptItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.25rem"
  },
  receiptTotal: {
    fontWeight: "bold",
    marginTop: "0.5rem",
    paddingTop: "0.5rem",
    borderTop: "1px solid #ddd"
  },
  receiptBarcode: {
    textAlign: "center" as const,
    margin: "1rem 0",
    fontSize: "0.875rem",
    letterSpacing: "2px"
  },
  receiptThankYou: {
    textAlign: "center" as const,
    margin: "1rem 0",
    fontWeight: "bold"
  },
  receiptFooter: {
    textAlign: "center" as const,
    fontSize: "0.75rem",
    color: "#777",
    marginTop: "1rem"
  }
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [voucherInfo, setVoucherInfo] = useState<{ code: string; discount_type: string } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "pending" as const,
      tracking_number: ""
    }
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('orders').select('*', { count: 'exact' });
      
      // Add search functionality if a search term is provided
      if (searchTerm) {
        query = query.ilike('id', `%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;
      
      console.log("Fetched orders:", data);
      
      // Cast the orders to match our interface
      setOrders(data as unknown as Order[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error memuat pesanan",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOrder = (order: Order) => {
    console.log("Editing order:", order);
    setSelectedOrder(order);
    form.reset({
      status: order.status as any,
      tracking_number: order.trackingNumber || ""
    });
    setIsEditing(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedOrder) return;
    
    setIsSaving(true);
    try {
      console.log("Updating order with values:", values);
      
      const { error } = await supabase
        .from('orders')
        .update({
          status: values.status,
          tracking_number: values.tracking_number || null
        })
        .eq('id', selectedOrder.id);
        
      if (error) throw error;
      
      toast({
        title: "Pesanan diperbarui",
        description: "Status pesanan telah berhasil diperbarui."
      });
      
      setIsEditing(false);
      fetchOrders(); // Refresh orders list
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: "Error memperbarui pesanan",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper function to get status badge style
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function untuk menerjemahkan status ke bahasa Indonesia
  const getStatusInIndonesian = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'processing':
        return 'Diproses';
      case 'shipped':
        return 'Dikirim';
      case 'delivered':
        return 'Diterima';
      case 'canceled':
        return 'Dibatalkan';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Added navigate hook for view button
  const navigate = useNavigate();

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };
  
  // Fungsi untuk menampilkan struk pesanan
  const handleShowReceipt = async (order: Order) => {
    setReceiptOrder(order);
    
    try {
      // Fetch customer profile
      const { data: customerData, error: customerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", order.user_id)
        .single();
        
      if (customerError) {
        console.warn("Error fetching customer:", customerError);
      } else {
        setCustomer(customerData);
      }
      
      // Fetch address if available
      if (order.shipping_address_id) {
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", order.shipping_address_id)
          .single();
          
        if (!addressError && addressData) {
          setAddress({
            id: addressData.id,
            name: addressData.name,
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zip: addressData.zip,
            country: addressData.country,
            isDefault: addressData.is_default || false,
            user_id: addressData.user_id,
            created_at: addressData.created_at
          });
        }
      }
      
      // Fetch shipping method if available
      if (order.shipping_method_id) {
        const { data: shippingData, error: shippingError } = await supabase
          .from("shipping_methods")
          .select("*")
          .eq("id", order.shipping_method_id)
          .single();
          
        if (!shippingError && shippingData) {
          setShippingMethod(shippingData);
        }
      }
      
      // Fetch order items if not already included
      if (!order.items || order.items.length === 0) {
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);
          
        if (!itemsError && orderItems) {
          order.items = orderItems.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price
          }));
          setReceiptOrder({...order});
        }
      }
      
      // Fetch voucher information if order has discount
      setVoucherInfo(null);
      if (order.voucher_id) {
        const { data: voucherData, error: voucherError } = await supabase
          .from("vouchers")
          .select("*")
          .eq("id", order.voucher_id)
          .single();
          
        if (!voucherError && voucherData) {
          setVoucherInfo({
            code: voucherData.code,
            discount_type: voucherData.discount_type
          });
        }
      }
      
      setReceiptDialogOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat struk pesanan",
        variant: "destructive"
      });
    }
  };
  
  // Fungsi untuk menyimpan struk sebagai gambar
  const handleSaveReceiptAsImage = async () => {
    if (!receiptRef.current || !receiptOrder) return;
    
    try {
      setIsSavingImage(true);
      
      const receiptElement = receiptRef.current;
      
      // Gunakan html2canvas untuk membuat gambar dari elemen struk
      const canvas = await html2canvas(receiptElement, {
        scale: 2, // Kualitas yang lebih tinggi
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Konversi canvas ke URL data
      const imgData = canvas.toDataURL('image/png');
      
      // Buat link untuk download
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Struk-Pesanan-${receiptOrder.id.substring(0, 8)}.png`;
      link.click();
      
      toast({
        title: "Struk Berhasil Disimpan",
        description: "Struk pesanan telah disimpan sebagai gambar",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving receipt as image:', error);
      toast({
        title: "Gagal Menyimpan Struk",
        description: "Terjadi kesalahan saat menyimpan struk sebagai gambar",
        variant: "destructive"
      });
    } finally {
      setIsSavingImage(false);
    }
  };
  
  // Fungsi untuk mencetak struk
  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    window.print();
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold mb-4">Manajemen Pesanan</h1>
      </div>
      
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Cari pesanan..." 
            className="pl-10" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Diskon</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader className="h-6 w-6 animate-spin mr-2" />
                      Memuat pesanan...
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Tidak ada pesanan ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(order.status)}`}>
                        {getStatusInIndonesian(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.discount_amount > 0 ? (
                        <span className="text-green-600">-{formatRupiah(order.discount_amount)}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        onClick={() => handleShowReceipt(order)}
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Struk
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!canGoPrevious}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={!canGoNext}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
      
      {/* Edit Order Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Perbarui Status Pesanan</SheetTitle>
          </SheetHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    ID Pesanan: {selectedOrder?.id}
                  </p>
                  <p className="text-sm font-medium">
                    Total: {formatRupiah(selectedOrder?.total)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tanggal: {selectedOrder?.date ? new Date(selectedOrder.date).toLocaleDateString('id-ID') : "Tidak Ada"}
                  </p>
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                        {...field}
                      >
                        <option value="pending">Menunggu</option>
                        <option value="processing">Diproses</option>
                        <option value="shipped">Dikirim</option>
                        <option value="delivered">Diterima</option>
                        <option value="canceled">Dibatalkan</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tracking_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Resi</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
      
      {/* Receipt Dialog */}
      {receiptOrder && (
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Struk Pesanan</DialogTitle>
            </DialogHeader>
            
            <div ref={receiptRef} style={receiptStyles.receipt}>
              <div style={receiptStyles.receiptHeader}>
                <h2 style={receiptStyles.receiptTitle}>Struk Belanja</h2>
                <div style={receiptStyles.receiptStoreInfo}>
                  <p><strong>Jaya Perkasa Charcoal</strong></p>
                  <p>Jl.legok conggeang kec.paseh , sumedang</p>
                  <p>Telp: 0813-9458-6882</p>
                </div>
                <div style={receiptStyles.receiptBorder}></div>
                <p className="mt-3 mb-1"><strong>Pesanan #{receiptOrder.id.substring(0, 8)}</strong></p>
                <p>{new Date(receiptOrder.date).toLocaleString('id-ID', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              {customer && (
                <div style={receiptStyles.receiptStoreInfo}>
                  <p><strong>Pelanggan:</strong> {customer.name || 'Tidak Ada'}</p>
                  <p>{customer.email || 'Tidak Ada'}</p>
                  <p>{customer.phone || 'Tidak Ada'}</p>
                </div>
              )}
              
              {address && (
                <div style={receiptStyles.receiptStoreInfo}>
                  <p><strong>Dikirim Ke:</strong></p>
                  <p>{address.name}</p>
                  <p>{address.street}</p>
                  <p>{`${address.city}, ${address.state} ${address.zip}`}</p>
                </div>
              )}
              
              <div style={receiptStyles.receiptBorder}></div>
              
              <div style={{margin: '0.5rem 0'}}>
                {receiptOrder.items && receiptOrder.items.map((item, index) => (
                  <div key={index} style={receiptStyles.receiptItem}>
                    <div>
                      <p>{item.productName}</p>
                      <p>Jml: {item.quantity} Kg × {formatRupiah(item.price)}</p>
                    </div>
                    <span>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-sm">
                <div className="flex justify-between py-1">
                  <span>Subtotal</span>
                  <span>{formatRupiah(receiptOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}</span>
                </div>
                
                {receiptOrder.discount_amount > 0 && (
                  <div className="flex justify-between py-1 text-green-600">
                  <span>Diskon Voucher {voucherInfo?.code ? `(${voucherInfo.code})` : ''}</span>
                  <span>-{formatRupiah(receiptOrder.discount_amount)}</span>
                </div>
                )}
                
                {shippingMethod && (
                  <div className="flex justify-between py-1">
                    <span>Pengiriman ({shippingMethod.name})</span>
                    <span>{formatRupiah(shippingMethod.cost)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-1 font-semibold">
                  <span>Total Yang Harus Di Bayar</span>
                  <span>{formatRupiah(receiptOrder.total)}</span>
                </div>
              </div>
              
              <div style={receiptStyles.receiptStoreInfo}>
                <p><strong>Metode Pembayaran:</strong> {
                  receiptOrder.paymentMethod === 'bank-transfer' ? 'Transfer Bank' : 
                  receiptOrder.paymentMethod === 'qris' ? 'QRIS' : 
                  receiptOrder.paymentMethod === 'cod' ? 'Bayar di Tempat (COD)' : 
                  'Pembayaran Standar'
                }</p>
              </div>
              
              <div style={receiptStyles.receiptBarcode}>
                <p>*******{receiptOrder.id.substring(0, 8)}*******</p>
              </div>
              
              <div style={receiptStyles.receiptThankYou}>
                <p>Silahkan Segera Melakukan Pembayaran Agar Pengiriman Segera Di Proses</p>
              </div>
              
              <div style={receiptStyles.receiptFooter}>
                <p>Layanan pelanggan: 0813-9458-6882</p>
                <p>Jika Arang Belum Di Kirim Silahkan Chat Admin Dan Berikan Struk Bukti Pembayaran</p>
                <p>Terima kasih</p>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => setReceiptDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Tutup
                </Button>
                <Button 
                  onClick={handlePrintReceipt}
                  className="flex-1"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak
                </Button>
                <Button 
                  onClick={handleSaveReceiptAsImage} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSavingImage}
                >
                  {isSavingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> 
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
