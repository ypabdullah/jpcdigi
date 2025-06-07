
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Package, 
  ArrowLeft,
  Printer, 
  Loader,
  Download,
  Loader2,
  AlertTriangle,
  Ban
} from "lucide-react";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import type { Order, OrderItem, Address, ShippingMethod, Voucher } from "@/data/models";
import { CoalInventoryService } from '@/integrations/coal-inventory/service';
import { CompanyExpenseService } from '@/integrations/expense/service';
import { OrderStatusManager } from '@/components/admin/OrderStatusManager';

export function AdminOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [voucherInfo, setVoucherInfo] = useState<{ code: string; discount_type: string } | null>(null);
  
  useEffect(() => {
    if (!id) return;
    fetchOrderDetails();
    
    // Get admin ID from Supabase auth
    const getAdminId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAdminId(session.user.id);
      }
    };
    
    getAdminId();
  }, [id]);
  
  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch order with items
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(*)
        `)
        .eq("id", id)
        .single();
        
      if (orderError) throw orderError;
      
      // Fetch customer profile
      const { data: customerData, error: customerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", orderData.user_id)
        .single();
        
      if (customerError) {
        console.warn("Error fetching customer:", customerError);
      } else {
        setCustomer(customerData);
      }
      
      // Fetch address if available
      if (orderData.shipping_address_id) {
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", orderData.shipping_address_id)
          .single();
          
        if (!addressError && addressData) {
          // Map is_default from the database to isDefault in our Address interface
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
      if (orderData.shipping_method_id) {
        const { data: shippingData, error: shippingError } = await supabase
          .from("shipping_methods")
          .select("*")
          .eq("id", orderData.shipping_method_id)
          .single();
          
        if (!shippingError && shippingData) {
          setShippingMethod(shippingData);
        }
      }
      
      // Check for customer notes in payment_details field
      if (orderData.payment_details && orderData.payment_details.includes("notes:")) {
        try {
          // Extract notes from payment_details if it exists
          const notesMatch = orderData.payment_details.match(/notes:(.*)/);
          if (notesMatch && notesMatch[1]) {
            setNotes(notesMatch[1].trim());
          }
        } catch (e) {
          console.error("Error parsing notes:", e);
        }
      }

      // Validate order status to ensure it matches the expected union type
      const validOrderStatus = (status: string): status is Order['status'] => {
        return ['pending', 'processing', 'shipped', 'delivered', 'canceled'].includes(status);
      };
      
      // Validate delivery status to ensure it matches the expected union type
      const validDeliveryStatus = (status: string | null): status is Order['delivery_status'] => {
        return status === null || ['pending', 'assigned', 'picked_up', 'delivered', 'failed'].includes(status);
      };
      
      const orderStatus = orderData.status;
      const deliveryStatus = orderData.delivery_status;
      
      // Format order data
      const formattedOrder: Order = {
        id: orderData.id,
        date: orderData.date,
        status: validOrderStatus(orderStatus) ? orderStatus as Order['status'] : 'pending',
        total: orderData.total,
        paymentMethod: orderData.payment_method,
        trackingNumber: orderData.tracking_number,
        shipping_address_id: orderData.shipping_address_id,
        shipping_method_id: orderData.shipping_method_id,
        user_id: orderData.user_id,
        delivery_status: validDeliveryStatus(deliveryStatus) ? deliveryStatus : 'pending',
        courier_id: orderData.courier_id,
        voucher_id: orderData.voucher_id,
        discount_amount: orderData.discount_amount || 0,
        items: orderData.order_items.map((item: any): OrderItem => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price,
          order_id: item.order_id
        }))
      };
      
      // Fetch voucher info if present
      if (orderData.voucher_id) {
        const { data: voucherData, error: voucherError } = await supabase
          .from("vouchers")
          .select("*")
          .eq("id", orderData.voucher_id)
          .single();
          
        if (!voucherError && voucherData) {
          setVoucherInfo({
            code: voucherData.code,
            discount_type: voucherData.discount_type
          });
        }
      }
      
      setOrder(formattedOrder);
    } catch (error: any) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error memuat pesanan",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
      navigate("/admin/orders");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk menyimpan struk sebagai gambar
  const handleSaveReceiptAsImage = async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsSavingImage(true);
      
      // Tunggu dialog terbuka dan konten dirender
      if (!receiptDialogOpen) {
        setReceiptDialogOpen(true);
        // Tunggu dialog muncul
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
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
      link.download = `Struk-Pesanan-${order?.id.substring(0, 8)}.png`;
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

  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    
    // Open receipt dialog first
    setReceiptDialogOpen(true);
    
    // Wait a bit for the dialog to render
    setTimeout(() => {
      const receiptContent = receiptRef.current;
      if (!receiptContent) return;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Gagal membuka jendela cetak",
          description: "Mohon izinkan popup untuk situs ini",
          variant: "destructive"
        });
        return;
      }
      
      // Create printable content
      const printContents = receiptContent.innerHTML;
      printWindow.document.write(`
        <style>
          @media print {
            body {
              font-family: system-ui, sans-serif;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt-header { 
              text-align: center;
              margin-bottom: 10px;
            }
            .receipt-items {
              border-top: 1px dashed #ccc;
              border-bottom: 1px dashed #ccc;
              padding: 10px 0;
              margin: 10px 0;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .receipt-total {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
            }
            .receipt-logo {
              max-width: 100px;
              margin: 0 auto 10px;
              display: block;
            }
            .receipt-store-info {
              text-align: center;
              font-size: 12px;
              margin-bottom: 15px;
            }
            .receipt-border {
              border-top: 1px dashed #ccc;
              margin: 10px 0;
            }
            .receipt-payment-info {
              font-size: 12px;
              margin-top: 10px;
            }
            .receipt-customer-info {
              font-size: 12px;
              margin-top: 10px;
              margin-bottom: 10px;
            }
            .receipt-barcode {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
            }
            .receipt-thank-you {
              text-align: center;
              margin-top: 15px;
              font-weight: bold;
            }
          }
        </style>
        ${printContents}
      `);
      
      printWindow.print();
      
      // Close the dialog after printing
      setReceiptDialogOpen(false);
    }, 500);
  };

  // Fungsi untuk menangani pembatalan pesanan
  const handleCancelOrder = async () => {
    if (!order || !id) return;
    
    try {
      setIsCancelling(true);
      
      // Update status pesanan di database
      const { error } = await supabase
        .from('orders')
        .update({ status: 'canceled' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Dapatkan id admin dari auth context atau local storage
      const adminId = await supabase.auth.getUser().then(({ data }) => {
        return data.user?.id || 'system';
      });

      // Mengembalikan stok arang jika pesanan mengandung produk arang
      if (order.items && order.items.length > 0) {
        // Restore stok arang dari pesanan yang dibatalkan
        await CoalInventoryService.restoreStockFromCancelledOrder(
          order.id,
          order.items.map(item => ({ 
            productName: item.productName, 
            quantity: item.quantity 
          })),
          adminId
        );
        
        // Hitung total nilai pesanan untuk pengurangan pengeluaran
        const orderTotal = order.total || order.items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        // Kurangi pengeluaran perusahaan sesuai dengan nilai pesanan yang dibatalkan
        await CompanyExpenseService.reduceCostFromCancelledOrder(
          order.id,
          adminId,
          orderTotal
        );
      }
      
      // Update state order dengan status baru
      setOrder({
        ...order,
        status: 'canceled'
      });
      
      toast({
        title: 'Pesanan Dibatalkan',
        description: 'Pesanan telah berhasil dibatalkan dan stok telah dikembalikan.',
      });
      
    } catch (error: any) {
      console.error('Error canceling order:', error);
      toast({
        title: 'Gagal Membatalkan Pesanan',
        description: error.message || 'Terjadi kesalahan saat membatalkan pesanan.',
        variant: 'destructive'
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
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
  const getStatusInIndonesian = (status: string | undefined) => {
    if (!status) return '';
    
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-lg text-gray-500">Memuat detail pesanan...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-4">
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">Pesanan tidak ditemukan</p>
                <Button 
                  onClick={() => navigate("/admin/orders")} 
                  className="bg-flame-500 hover:bg-flame-600"
                >
                  Kembali ke Pesanan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/orders")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Pesanan
            </Button>
            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              className="ml-2"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak Struk
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveReceiptAsImage}
              className="ml-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={isSavingImage}
            >
              {isSavingImage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Simpan Struk
            </Button>
            <h1 className="text-2xl font-bold">Pesanan #{id}</h1>
          </div>
          
          <div className="flex items-center">
            {order && order.status !== 'canceled' && (
              <Button 
                variant="destructive" 
                onClick={() => setCancelDialogOpen(true)} 
                className="mr-2"
                disabled={order.status === 'delivered'}
              >
                <Ban className="h-4 w-4 mr-2" />
                Batalkan Pesanan
              </Button>
            )}
            <Button onClick={handlePrintReceipt} className="bg-flame-500 hover:bg-flame-600">
              <Printer className="h-4 w-4 mr-2" />
              Cetak Struk
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Status Manager Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Pesanan</CardTitle>
              <CardDescription>
                Perbarui status pesanan dan kirim notifikasi WhatsApp ke pelanggan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusManager 
                orderId={order.id}
                currentStatus={order.status}
                adminId={adminId}
                onStatusUpdated={(newStatus) => {
                  // Update local state to reflect the new status
                  // Menggunakan type assertion untuk memastikan tipe data sesuai
                  setOrder({
                    ...order,
                    status: newStatus as Order['status']
                  });
                }}
              />
            </CardContent>
          </Card>
          
          {/* Order Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">Ringkasan Pesanan</CardTitle>
              <CardDescription>
                ID Pesanan: {order?.id}
                {order && (
                  <Badge className={`ml-2 ${getStatusBadgeClass(order.status)}`}>
                    {getStatusInIndonesian(order.status)}
                  </Badge>
                )}
              </CardDescription>
              <CardDescription>
                Tanggal: {order ? new Date(order.date).toLocaleString('id-ID', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ""}
              </CardDescription>
              {order?.trackingNumber && (
                <CardDescription>
                  Nomor Resi: {order.trackingNumber}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-1 mb-6">
                <h3 className="font-semibold mb-2">Daftar Pesanan</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order?.items && order.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-charcoal-100 rounded flex-shrink-0 flex items-center justify-center">
                              <Package className="h-5 w-5 text-charcoal-400" />
                            </div>
                            <span>{item.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                        <TableCell className="text-right">{formatRupiah(item.quantity * item.price)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} />
                      <TableCell className="font-medium text-right">Subtotal:</TableCell>
                      <TableCell className="font-medium text-right">
                        {order ? formatRupiah(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)) : ""}
                      </TableCell>
                    </TableRow>
                    {/* Menampilkan diskon jika ada */}
                    {order?.discount_amount > 0 && (
                      <TableRow>
                        <TableCell colSpan={2} />
                        <TableCell className="font-medium text-right text-green-600">Diskon Voucher:</TableCell>
                        <TableCell className="font-medium text-right text-green-600">
                          -{formatRupiah(order.discount_amount)}
                        </TableCell>
                      </TableRow>
                    )}
                    {shippingMethod && (
                      <TableRow>
                        <TableCell colSpan={2} />
                        <TableCell className="font-medium text-right">Pengiriman ({shippingMethod.name}):</TableCell>
                        <TableCell className="font-medium text-right">{formatRupiah(shippingMethod.cost)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={2} />
                      <TableCell className="font-bold text-right">Total:</TableCell>
                      <TableCell className="font-bold text-right">
                        {order ? formatRupiah(order.total) : ""}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {notes && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Catatan Pelanggan</h3>
                  <div className="text-sm text-gray-500 italic">
                    {notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Pelanggan</h3>
                  <p>{customer?.name || 'N/A'}</p>
                  <p>{customer?.email || 'N/A'}</p>
                  <p>{customer?.phone || 'N/A'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Alamat Pengiriman</h3>
                  {address ? (
                    <>
                      <p>{address.name}</p>
                      <p>{address.street}</p>
                      <p>{`${address.city}, ${address.state} ${address.zip}`}</p>
                      <p>{address.country}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Tidak ada alamat yang diberikan</p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Metode Pembayaran</h3>
                  <p>{order.paymentMethod === 'bank-transfer' ? 'Transfer Bank' : 
                      order.paymentMethod === 'qris' ? 'QRIS' : 
                      order.paymentMethod === 'cod' ? 'Bayar di Tempat' : 
                      order.paymentMethod || "Pembayaran Standar"}
                  </p>
                </div>
                
                {shippingMethod && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Metode Pengiriman</h3>
                      <p>{shippingMethod.name} - {shippingMethod.carrier}</p>
                      <p>Perkiraan waktu pengiriman: {shippingMethod.estimated_days} Jam</p>
                      <p className="font-medium">{formatRupiah(shippingMethod.cost)}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Konfirmasi Pembatalan</DialogTitle>
            <DialogDescription className="text-center pt-4">
              Apakah Anda yakin ingin membatalkan pesanan ini?
              <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>Stok arang akan dikembalikan secara otomatis.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Ya, Batalkan Pesanan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Print Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Struk Pesanan</DialogTitle>
          </DialogHeader>
          
          <div ref={receiptRef} className="p-4">
            <div className="receipt-header">
              <h2 className="text-xl font-bold mb-1">Struk Belanja</h2>
              <div className="receipt-store-info">
                <p><strong>Jaya Perkasa Charcoal</strong></p>
                <p>Jl.legok conggeang kec.paseh , sumedang</p>
                <p>Telp: 0813-9458-6882</p>
              </div>
              <div className="receipt-border"></div>
              <p className="mt-3 mb-1"><strong>ID Pesanan #{order.id.substring(0, 8)}</strong></p>
              <p>{new Date(order.date).toLocaleString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            
            {customer && (
              <div className="receipt-customer-info">
                <p><strong>Pelanggan:</strong> {customer.name || 'Tidak Ada'}</p>
                <p>{customer.email || 'Tidak Ada'}</p>
                <p>{customer.phone || 'Tidak Ada'}</p>
              </div>
            )}
            
            {address && (
              <div className="receipt-customer-info">
                <p><strong>Alamat Pengiriman:</strong></p>
                <p>{address.name}</p>
                <p>{address.street}</p>
                <p>{`${address.city}, ${address.state} ${address.zip}`}</p>
              </div>
            )}
            
            <table className="w-full mt-4 mb-3">
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-center">Jml</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-left">{item.productName}</td>
                    <td className="text-center">{item.quantity}x</td>
                    <td className="text-right">{formatRupiah(item.price)}</td>
                    <td className="text-right">{formatRupiah(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="receipt-border"></div>
            
            <div className="receipt-totals">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
              </div>
              
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon Voucher {voucherInfo?.code ? `(${voucherInfo.code})` : ''}:</span>
                  <span>-{formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Subtotal sebelum diskon:</span>
                <span>{formatRupiah(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + order.discount_amount)}</span>
              </div>
              
              {shippingMethod && (
                <div className="flex justify-between">
                  <span>Pengiriman ({shippingMethod.name}):</span>
                  <span>{formatRupiah(shippingMethod.cost)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold mt-2">
                <span>Total:</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
            </div>
            
            <div className="receipt-payment-info">
              <p><strong>Metode Pembayaran:</strong> {
                order.paymentMethod === 'bank-transfer' ? 'Transfer Bank' : 
                order.paymentMethod === 'qris' ? 'QRIS' : 
                order.paymentMethod === 'cod' ? 'Bayar di Tempat' : 
                'Pembayaran Standar'
              }</p>
            </div>
            
            <div className="receipt-barcode">
              <p>*******{order.id.substring(0, 8)}*******</p>
            </div>
            
            <div className="receipt-thank-you">
              <p>Terima kasih atas pembelian Anda!</p>
            </div>
            
            <div className="receipt-footer">
              <p>Untuk layanan pelanggan: support@example.com</p>
              <p>Simpan struk ini untuk pengembalian atau penukaran</p>
              <p>Pengembalian diterima dalam 24 jam setelah pembelian</p>
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
                onClick={() => window.print()}
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
    </AdminLayout>
  );
}
