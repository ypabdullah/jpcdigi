import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, PackageIcon, Truck, Receipt, Banknote, QrCode, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Separator } from "@/components/ui/separator";
import "./receipt.css"; // CSS untuk styling struk
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Order, OrderItem, Address, BankAccount, ShippingMethod } from "@/data/models";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";

// Bank account details for transfers
const bankAccounts: BankAccount[] = [
  {
    bank: "SeaBank",
    accountNumber: "901958730549",
    accountName: "Yoga Prasetya"
  },
  {
    bank: "DANA",
    accountNumber: "081394586882",
    accountName: "Yoga Prasetya"
  }
];

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [voucherInfo, setVoucherInfo] = useState<{ code: string; discount_type: string } | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(*)
          `)
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
          
        if (orderError) throw orderError;
        
        // If order has a shipping address, fetch it
        let addressData = null;
        if (orderData.shipping_address_id && orderData.shipping_address_id !== 'undefined') {
          const { data: shipAddress, error: addressError } = await supabase
            .from("addresses")
            .select("*")
            .eq("id", orderData.shipping_address_id)
            .single();
            
          if (!addressError) {
            addressData = {
              id: shipAddress.id,
              name: shipAddress.name,
              street: shipAddress.street,
              city: shipAddress.city,
              state: shipAddress.state,
              zip: shipAddress.zip,
              country: shipAddress.country,
              isDefault: shipAddress.is_default,
              user_id: shipAddress.user_id,
              created_at: shipAddress.created_at
            };
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
        } else {
          // If there's no shipping method id in the order, fetch a default shipping method from Supabase
          // This ensures we're always using real data from the database
          const { data: defaultShippingData, error: defaultShippingError } = await supabase
            .from("shipping_methods")
            .select("*")
            .limit(1)
            .single();
            
          if (!defaultShippingError && defaultShippingData) {
            setShippingMethod(defaultShippingData);
          }
        }
        
        // Validate and transform the order data
        if (orderData) {
          // Map order items
          const items = orderData.order_items.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price
          }));
          
          // If no valid payment method, default to bank transfer
          let paymentMethod = orderData.payment_method;
          
          if (!validPaymentMethod(paymentMethod)) {
            paymentMethod = 'bank-transfer';
          }
          
          // Validate order status
          let status = orderData.status;
          if (!validOrderStatus(status)) {
            status = 'pending';
          }
          
          // Create order object
          const order: Order = {
            id: orderData.id,
            userId: orderData.user_id,
            date: orderData.date,
            status: status as Order['status'],
            paymentMethod: paymentMethod as Order['paymentMethod'],
            total: orderData.total,
            trackingNumber: orderData.tracking_number || '',
            items,
            shippingAddressId: orderData.shipping_address_id,
            shippingMethodId: orderData.shipping_method_id,
            voucher_id: orderData.voucher_id,
            discount_amount: orderData.discount_amount || 0
          };
          
          setOrder(order);
          setAddress(addressData);
          
          // Fetch voucher information if present
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
          
          // Randomly select a bank account for display if payment is bank transfer
          if (order.paymentMethod === 'bank-transfer') {
            const randomIndex = Math.floor(Math.random() * bankAccounts.length);
            setSelectedBankAccount(bankAccounts[randomIndex]);
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast({
          title: "Error",
          description: "Gagal memuat detail pesanan",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Validate order status to ensure it matches the expected union type
    const validOrderStatus = (status: string): status is Order['status'] => {
      return ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
    };
    
    // Validate payment method
    const validPaymentMethod = (method: string): method is Order['paymentMethod'] => {
      return ['bank-transfer', 'credit-card', 'cod', 'qris'].includes(method);
    };
    
    fetchOrderDetails();
  }, [id, user, toast]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-500';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-500';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'processing':
        return 'Diproses';
      case 'shipped':
        return 'Dikirim';
      case 'delivered':
        return 'Terkirim';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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
      
      // Cari semua tombol/elemen yang ingin disembunyikan saat mengambil gambar
      const actionButtons = receiptElement.querySelector('.hidden-on-print');
      let originalDisplay = '';
      
      // Simpan status tampilan asli dan sembunyikan tombol
      if (actionButtons) {
        originalDisplay = (actionButtons as HTMLElement).style.display;
        (actionButtons as HTMLElement).style.display = 'none';
      }
      
      // Tunggu sedikit agar perubahan DOM diterapkan
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Gunakan html2canvas untuk membuat gambar dari elemen struk
      const canvas = await html2canvas(receiptElement, {
        scale: 2, // Kualitas yang lebih tinggi
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Kembalikan tombol ke status tampilan asli
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = originalDisplay;
      }
      
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
      
      // Create printable content with compact styling
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Struk Pesanan #${order?.id.substring(0, 8)}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @page {
              size: 80mm 297mm; /* Standard thermal receipt size */
              margin: 0;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 10px;
              line-height: 1.2;
              width: 76mm;
              margin: 2mm auto;
              padding: 0;
            }
            * {
              box-sizing: border-box;
            }
            .receipt-header { 
              text-align: center;
              margin-bottom: 8px;
            }
            .receipt-header h2 {
              font-size: 12px;
              margin: 0 0 4px 0;
            }
            .receipt-items {
              border-top: 1px dashed #ccc;
              border-bottom: 1px dashed #ccc;
              padding: 8px 0;
              margin: 8px 0;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .receipt-total {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 12px;
              font-size: 9px;
            }
            .receipt-store-info {
              text-align: center;
              font-size: 9px;
              margin-bottom: 8px;
            }
            .receipt-border {
              border-top: 1px dashed #ccc;
              margin: 8px 0;
            }
            .receipt-payment-info {
              font-size: 9px;
              margin-top: 8px;
            }
            .receipt-customer-info {
              font-size: 9px;
              margin: 8px 0;
            }
            .receipt-barcode {
              text-align: center;
              margin-top: 12px;
              font-size: 9px;
              letter-spacing: 2px;
            }
            .receipt-thank-you {
              text-align: center;
              margin-top: 12px;
              font-weight: bold;
            }
            .print-button {
              display: block;
              width: 100%;
              background: #e63946;
              color: white;
              border: none;
              padding: 8px;
              font-size: 14px;
              font-weight: bold;
              border-radius: 4px;
              margin: 16px 0;
              cursor: pointer;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
          <button class="print-button" onclick="window.print(); setTimeout(() => window.close(), 500);">Cetak Struk</button>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
    }, 500);
  };
  
  if (isLoading) {
    return (
      <MobileLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
          <p>Tunggu Sebentar...</p>
        </div>
      </MobileLayout>
    );
  }
  
  if (!order) {
    return (
      <MobileLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
          <Button 
            onClick={() => navigate("/")} 
            className="mt-4 bg-flame-500 hover:bg-flame-600"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex items-center p-4 bg-background sticky top-0 z-10 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Detail Pesanan</h1>
      </div>
      <div className="container max-w-md mx-auto p-4 pb-20">
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
              ID Pesanan: {order.id.substring(0, 8)}...
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground mb-4">
            Pesanan dibuat pada {new Date(order.date).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          {order.trackingNumber && (
            <div className="bg-secondary p-3 rounded-md flex items-center mb-4">
              <Truck className="h-5 w-5 mr-2 text-flame-500" />
              <div>
                <p className="text-sm font-medium">Nomor Resi</p>
                <p className="text-xs">{order.trackingNumber}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Daftar Pesanan</h2>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={handlePrintReceipt}
            >
              <Receipt className="h-4 w-4" />
              <span>Cetak Struk</span>
            </Button>
          </div>
          <div className="space-y-3">
            {order.items.map((item) => (
              <Card key={item.id} className="overflow-hidden shadow-sm">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 bg-charcoal-100 rounded flex-shrink-0 flex items-center justify-center">
                      <PackageIcon className="h-8 w-8 text-charcoal-400" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <div>
                          <Link to={`/product/${item.productId}`}>
                            <h3 className="font-medium text-sm line-clamp-2">{item.productName}</h3>
                          </Link>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">
                              Jumlah: {item.quantity} × {formatRupiah(item.price)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatRupiah(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Ringkasan Pesanan</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatRupiah(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
            </div>
            
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon Voucher {voucherInfo?.code ? `(${voucherInfo.code})` : ''}</span>
                <span>-{formatRupiah(order.discount_amount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span>Pengiriman ({shippingMethod?.name})</span>
              <span>{formatRupiah(shippingMethod?.cost || 0)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>
        
        {address && (
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Alamat Pengiriman</h2>
            <Card>
              <CardContent className="p-3">
                <p className="font-medium">{address.name}</p>
                <p className="text-sm text-muted-foreground">{address.street}</p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-sm text-muted-foreground">{address.country}</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Metode Pembayaran</h2>
          <Card>
            <CardContent className="p-3 flex items-center">
              {order.paymentMethod === 'bank-transfer' && (
                <>
                  <Banknote className="h-5 w-5 mr-3 text-flame-500" />
                  <div>
                    <p className="font-medium">Transfer Bank</p>
                    {selectedBankAccount && (
                      <p className="text-sm text-muted-foreground">
                        {selectedBankAccount.bank} - {selectedBankAccount.accountNumber}
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {order.paymentMethod === 'credit-card' && (
                <>
                  <svg className="h-5 w-5 mr-3 text-flame-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="1" y="4" width="22" height="16" rx="2" strokeWidth="2" />
                    <line x1="1" y1="10" x2="23" y2="10" strokeWidth="2" />
                  </svg>
                  <div>
                    <p className="font-medium">Kartu Kredit</p>
                    <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                  </div>
                </>
              )}
              
              {order.paymentMethod === 'cod' && (
                <>
                  <Truck className="h-5 w-5 mr-3 text-flame-500" />
                  <div>
                    <p className="font-medium">Bayar di Tempat (COD)</p>
                    <p className="text-sm text-muted-foreground">Pembayaran saat barang diterima</p>
                  </div>
                </>
              )}
              
              {order.paymentMethod === 'qris' && (
                <>
                  <QrCode className="h-5 w-5 mr-3 text-flame-500" />
                  <div>
                    <p className="font-medium">QRIS</p>
                    <p className="text-sm text-muted-foreground">Pembayaran menggunakan QRIS</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex space-x-3 mb-6">
         
          <Button onClick={() => setReceiptDialogOpen(true)} className="flex-1">
            <Receipt className="mr-2 h-4 w-4" />
            Lihat Struk
          </Button>
           
        </div>
        
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Struk Pesanan</DialogTitle>
            </DialogHeader>
            
            <div ref={receiptRef} className="receipt-container">
              <div className="receipt-header">
                <h2 className="receipt-title">Struk Belanja</h2>
                <div className="receipt-store-info">
                  <p className="receipt-store-name"><strong>Jaya Perkasa Charcoal</strong></p>
                  <p>Jl.legok conggeang kec.paseh , sumedang</p>
                  <p>Telp: 0813-9458-6882</p>
                </div>
                <div className="receipt-border"></div>
                <p className="mt-3 mb-1"><strong>Pesanan #{order.id.substring(0, 8)}</strong></p>
                <p>{new Date(order.date).toLocaleString('id-ID', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              {address && (
                <div className="receipt-customer-info">
                  <p><strong>Dikirim Ke:</strong> {address.name}</p>
                  <p>{address.street}</p>
                  <p>{`${address.city}, ${address.state} ${address.zip}`}</p>
                </div>
              )}
              
              <div className="receipt-border"></div>
              
              <div className="receipt-items">
                {order.items.map((item, index) => (
                  <div key={index} className="receipt-item">
                    <div>
                      <p>{item.productName}</p>
                      <p>Jml: {item.quantity} × {formatRupiah(item.price)}</p>
                    </div>
                    <span>{formatRupiah(item.quantity * item.price)}</span>
                  </div>
                ))}
              </div>
              
              <div className="receipt-border"></div>
              
              <div>
                <div className="receipt-item">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                </div>
                
                {order.discount_amount > 0 && (
                  <div className="receipt-item" style={{color: '#22c55e'}}>
                    <span>Diskon Voucher {voucherInfo?.code ? `(${voucherInfo.code})` : ''}</span>
                    <span>-{formatRupiah(order.discount_amount)}</span>
                  </div>
                )}
                
                {shippingMethod && (
                  <div className="receipt-item">
                    <span>Pengiriman ({shippingMethod.name})</span>
                    <span>{formatRupiah(shippingMethod.cost)}</span>
                  </div>
                )}
                <div className="receipt-total">
                  <span>Total</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
              </div>
              
              <div className="receipt-payment-info">
                <p><strong>Metode Pembayaran:</strong> {
                  order.paymentMethod === 'bank-transfer' ? 'Transfer Bank' : 
                  order.paymentMethod === 'qris' ? 'QRIS' : 
                  order.paymentMethod === 'cod' ? 'Bayar di Tempat (COD)' : 
                  'Pembayaran Standar'
                }</p>
                {order.paymentMethod === 'bank-transfer' && selectedBankAccount && (
                  <p>Bank: {selectedBankAccount.bank} - {selectedBankAccount.accountNumber}</p>
                )}
              </div>
              
              <div className="receipt-barcode">
                <p>*******{order.id.substring(0, 8)}*******</p>
              </div>
              
              <div className="receipt-thank-you">
                <p>Jika ingin mendapatkan harga murah atau diskon segera hubungi admin</p>
              </div>
              
              <div className="receipt-footer">
                <p>Layanan pelanggan: 0813-9458-6882</p>
                <p>Jika Arang Belum Di Kirim Silahkan Chat Admin Dan Berikan Struk Bukti Pembayaran</p>
                <p>Terima kasih</p>
              </div>
              
              <div className="mt-4 hidden-on-print space-y-2">
                <Button 
                  onClick={() => window.print()} 
                  className="w-full"
                >
                  Cetak Struk
                </Button>
                <Button 
                  onClick={handleSaveReceiptAsImage} 
                  className="w-full bg-green-600 hover:bg-green-700"
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
                      Simpan Sebagai Gambar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default OrderDetailsPage;
