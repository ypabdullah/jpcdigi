import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, BadgeCheck, Check, ArrowRight, Loader2, Banknote, CreditCard, QrCode, Ticket, X, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Address, PaymentMethodType, BankAccount, OrderItem, Product, ShippingMethod, Voucher } from "@/data/models";
import { VoucherService } from "@/integrations/voucher/service";
import { CoalInventoryService } from "@/integrations/coal-inventory/service";
import { sendOrderNotificationToAdmins } from "@/integrations/firebase/notification-service";
import { sendOrderNotificationToCustomer } from "@/integrations/firebase/order-customer-notification-service";
import { sendWhatsAppMessage } from "@/integrations/whatsapp/api";
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

// Helper function to translate payment method to Indonesian
const translatePaymentMethod = (method: string): string => {
  const translations: Record<string, string> = {
    'bank-transfer': 'Transfer Bank',
    'cod': 'Bayar di Tempat (COD)',
    'qris': 'QRIS',
    'credit-card': 'Kartu Kredit',
    'ewallet': 'E-Wallet'
  };
  
  return translations[method] || method;
};

const CheckoutPage = () => {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Menghitung total dari keranjang
  const cartSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = parseFloat(cartSubtotal.toFixed(2));
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("bank-transfer");
  const [selectedBank, setSelectedBank] = useState<string>(bankAccounts[0].bank);
  const [shippingMethod, setShippingMethod] = useState<string>("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableShippingMethods, setAvailableShippingMethods] = useState<Array<{
    id: string;
    name: string;
    cost: number;
    estimated_days: number;
  }>>([]);
  
  // State untuk voucher
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // State for completed order display
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<any>(null);
  
  // Perhitungan total dengan diskon dan pengiriman
  const shippingCost = availableShippingMethods.find(m => m.id === shippingMethod)?.cost || 0;
  const totalWithDiscount = total - discountAmount;
  const totalWithShipping = totalWithDiscount + shippingCost;

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/cart");
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk melanjutkan ke checkout",
        variant: "destructive"
      });
    }
  }, [user, navigate]);
  
  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);
  
  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Format addresses to match our model
          const formattedAddresses = data.map(addr => ({
            id: addr.id,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zip: addr.zip,
            country: addr.country,
            isDefault: addr.is_default,
            user_id: addr.user_id,
            created_at: addr.created_at
          }));
          
          setAddresses(formattedAddresses);
          
          // Set default address if available
          const defaultAddress = formattedAddresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          } else if (formattedAddresses.length > 0) {
            setSelectedAddressId(formattedAddresses[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast({
          title: "Error",
          description: "Tidak dapat memuat alamat Anda",
          variant: "destructive"
        });
      }
    };
    
    fetchAddresses();
  }, [user]);

  // Fetch shipping methods
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const { data, error } = await supabase
          .from("shipping_methods")
          .select("*")
          .eq("active", true);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setAvailableShippingMethods(data);
          setShippingMethod(data[0].id);
        } else {
          // Fallback to default shipping methods if none in database
          const defaultMethods = [
            { id: "standard", name: "Pengiriman Standar", cost: 15000, estimated_days: 5, carrier: "JNE" },
            { id: "express", name: "Pengiriman Express", cost: 30000, estimated_days: 2, carrier: "JNE Express" }
          ];
          setAvailableShippingMethods(defaultMethods);
          setShippingMethod(defaultMethods[0].id);
        }
      } catch (error) {
        console.error("Error fetching shipping methods:", error);
        // Fallback to default shipping methods
        const defaultMethods = [
          { id: "standard", name: "Pengiriman Standar", cost: 15000, estimated_days: 5, carrier: "JNE" },
          { id: "express", name: "Pengiriman Express", cost: 30000, estimated_days: 2, carrier: "JNE Express" }
        ];
        setAvailableShippingMethods(defaultMethods);
        setShippingMethod(defaultMethods[0].id);
      }
    };
    
    fetchShippingMethods();
  }, []);
  
  // Fungsi untuk mencari dan menerapkan voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Kode Voucher Kosong",
        description: "Silakan masukkan kode voucher",
        variant: "destructive"
      });
      return;
    }
    
    setVoucherLoading(true);
    try {
      const { data, error } = await VoucherService.getVoucherByCode(voucherCode);
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error("Voucher tidak ditemukan");
      }
      
      // Cek minimum pembelian jika ada
      if (data.min_purchase && total < data.min_purchase) {
        throw new Error(`Minimum pembelian untuk voucher ini adalah ${formatRupiah(data.min_purchase)}`);
      }
      
      // Hitung diskon
      const discount = VoucherService.calculateDiscount(data, total);
      
      // Terapkan voucher
      setAppliedVoucher(data);
      setDiscountAmount(discount);
      
      toast({
        title: "Voucher Diterapkan",
        description: `Anda mendapatkan diskon sebesar ${formatRupiah(discount)}`,
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error applying voucher:", error);
      toast({
        title: "Gagal Menerapkan Voucher",
        description: error.message || "Terjadi kesalahan saat menerapkan voucher",
        variant: "destructive"
      });
    } finally {
      setVoucherLoading(false);
    }
  };
  
  // Fungsi untuk menghapus voucher yang diterapkan
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscountAmount(0);
    setVoucherCode("");
    
    toast({
      title: "Voucher Dihapus",
      description: "Voucher telah dihapus dari pesanan Anda",
      variant: "default"
    });
  };

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0 || !selectedAddressId || selectedAddressId === 'undefined') {
      toast({
        title: "Error",
        description: "Data tidak lengkap untuk membuat pesanan",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log("Creating order with data:", {
        user_id: user.id,
        total: totalWithShipping,
        status: "pending",
        payment_method: paymentMethod,
        shipping_address_id: selectedAddressId,
        payment_details: paymentMethod === 'bank-transfer' ? selectedBank : null,
        voucher_id: appliedVoucher?.id || null,
        discount_amount: discountAmount || 0
      });
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: totalWithShipping,
          status: "pending",
          payment_method: paymentMethod,
          shipping_address_id: selectedAddressId,
          date: new Date().toISOString(),
          payment_details: paymentMethod === 'bank-transfer' ? selectedBank : null,
          voucher_id: appliedVoucher?.id || null,
          discount_amount: discountAmount || 0
        })
        .select()
        .single();
        
      if (orderError) {
        console.error("Order creation error:", orderError);
        throw orderError;
      }
      
      console.log("Order created successfully:", orderData);
      
      // Create order items - insert each order item separately
      for (const item of items) {
        console.log("Inserting order item:", {
          order_id: orderData.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        });
        
        const { error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: orderData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
          });
          
        if (itemError) {
          console.error("Error inserting order item:", itemError);
          throw itemError;
        }
      }
      
      // Kurangi stok arang jika ada produk arang dalam pesanan
      try {
        // Mengurangi stok arang berdasarkan pesanan yang dibuat
        await CoalInventoryService.reduceStockFromOrder(
          orderData.id,
          items.map(item => ({
            productName: item.name,
            quantity: item.quantity
          })),
          user.id
        );
        console.log('Coal inventory updated after order creation');
      } catch (inventoryError) {
        console.error('Error updating coal inventory:', inventoryError);
        // Tidak perlu menampilkan error ke pengguna, hanya catat di log
      }
      
      // Jika ada voucher yang digunakan, catat penggunaannya
      if (appliedVoucher) {
        try {
          await VoucherService.incrementUsageCount(appliedVoucher.id);
          console.log('Voucher usage count updated');
        } catch (voucherError) {
          console.error('Error updating voucher usage count:', voucherError);
          // Tidak perlu menampilkan error ke pengguna, hanya catat di log
        }
      }
      
      // Show success message
      toast({
        title: "Pesanan berhasil dibuat!",
        description: "Terima kasih atas pembelian Anda."
      });

      // Send notification to admins about the new order
      try {
        await sendOrderNotificationToAdmins(orderData);
        console.log('Order notification sent to admins');
      } catch (notificationError) {
        console.error('Error sending order notification to admins:', notificationError);
        // Don't show error to user, just log it
      }
      
      // Send notification to customer about their new order with complete order details
      try {
        // First get complete data for a detailed notification
        // Get shipping address information
        const { data: addressData } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', selectedAddressId)
          .single();

        // Get order items with full details
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderData.id);

        // Get payment details
        const paymentDetails = {
          name: translatePaymentMethod(paymentMethod),
          bank_name: paymentMethod === 'bank-transfer' ? selectedBank : undefined,
          account_number: paymentMethod === 'bank-transfer' ? 
            bankAccounts.find(b => b.bank === selectedBank)?.accountNumber : undefined,
          account_name: paymentMethod === 'bank-transfer' ? 
            bankAccounts.find(b => b.bank === selectedBank)?.accountName : undefined
        };

        // Get shipping method details
        const selectedShipping = availableShippingMethods.find(m => m.id === shippingMethod);
        const shippingDetails = {
          name: selectedShipping?.name || 'Pengiriman Standar',
          cost: selectedShipping?.cost || shippingCost,
          estimated_days: selectedShipping?.estimated_days || 2,
          carrier: 'JPC Delivery' // Default carrier
        };

        // Create complete order data for notification
        const enhancedOrderData = {
          ...orderData,
          shipping_cost: shippingCost,
          shipping_provider: shippingDetails.carrier,
          shipping_service: shippingDetails.name,
          shipping_estimate: `${shippingDetails.estimated_days} hari`,
          discount_data: appliedVoucher ? {
            code: appliedVoucher.code,
            value: discountAmount,
            type: 'fixed'
          } : undefined,
          payment_status: 'Belum dibayar'
        };
        
        console.log('Sending order details to customer via notification service');

        // Send notification to customer - this function already handles WhatsApp notification
        // so we only need to call it once to avoid duplicate messages
        await sendOrderNotificationToCustomer(enhancedOrderData);
        
        // No need for a separate WhatsApp notification call as it's already handled in the above function
        // This prevents duplicate WhatsApp messages
        console.log('WhatsApp notification is handled by the notification service');
        
        // Log if the customer doesn't have a phone number
        if (!profile?.phone) {
          console.log('Customer has no phone number, WhatsApp notification may be skipped');
        }
      } catch (notificationError) {
        console.error('Error sending notification to customer:', notificationError);
        // Don't show error to user, just log it
      }
      
      // Clear cart
      clearCart();
      
      // Store order ID in session storage to ensure it persists even if page refreshes
      const orderId = orderData.id;
      sessionStorage.setItem('lastCompletedOrderId', orderId);
      
      // Log the navigation attempt for debugging
      console.log(`⏩ Redirecting to order details page: /order/${orderId}`);
      
      // Ensure order creation is visible to the user before navigation
      toast({
        title: "Mengarahkan ke halaman detail pesanan",
        description: "Mohon tunggu sebentar..."
      });
      
      // Bersihkan keranjang setelah order berhasil dibuat
      clearCart();
      
      // Tampilkan toast sukses
      toast({
        title: "Pesanan Berhasil Dibuat",
        description: "Anda akan diarahkan ke halaman detail pesanan.",
        className: "bg-green-100 border-green-400"
      });
      
      // Arahkan pelanggan ke halaman detail pesanan
      setTimeout(() => {
        navigate(`/order/${orderData.id}`);
      }, 1500); // Berikan delay 1.5 detik agar toast dapat dibaca
      
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Tidak dapat membuat pesanan Anda. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethodType);
  };
  
  if (!user || addresses.length === 0) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Link to="/cart" className="flex items-center text-charcoal-600">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>Kembali ke Keranjang</span>
            </Link>
            <h1 className="text-lg font-medium flex-1 text-center">Checkout</h1>
            <div className="w-8"></div>
          </div>
          
          <div className="text-center py-10">
            <p className="mb-4">
              Anda perlu menambahkan alamat pengiriman sebelum checkout.
            </p>
            <Link to="/address/new">
              <Button className="bg-flame-500 hover:bg-flame-600">
                Tambah Alamat
              </Button>
            </Link>
          </div>
        </div>
      </MobileLayout>
    );
  }
  
  // Component to display order completed details
  const OrderCompletedDetails = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [orderDetail, setOrderDetail] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [shippingAddress, setShippingAddress] = useState<any>(null);
    const [shippingMethodDetail, setShippingMethodDetail] = useState<any>(null);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    
    // If order data is not available, show placeholder
    if (!completedOrderData) {
      return <div className="p-4 text-center">Memuat detail pesanan...</div>;
    }
    
    // Fetch detailed order data from Supabase
    useEffect(() => {
      async function fetchOrderDetails() {
        setIsLoading(true);
        try {
          // Fetch order details
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', completedOrderData.id)
            .single();
            
          if (orderError) throw orderError;
          setOrderDetail(orderData);
          
          // Fetch order items
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', completedOrderData.id);
            
          if (itemsError) throw itemsError;
          setOrderItems(items || []);
          
          // Fetch shipping address
          if (orderData.shipping_address_id) {
            const { data: address, error: addressError } = await supabase
              .from('addresses')
              .select('*')
              .eq('id', orderData.shipping_address_id)
              .single();
              
            if (!addressError && address) {
              setShippingAddress(address);
            }
          }
          
          // Fetch shipping method details
          const shippingId = orderData.shipping_id || orderData.shipping_method_id;
          if (shippingId) {
            const { data: shipping, error: shippingError } = await supabase
              .from('shipping_methods')
              .select('*')
              .eq('id', shippingId)
              .single();
              
            if (!shippingError && shipping) {
              setShippingMethodDetail(shipping);
            }
          }
          
          // Prepare payment details if bank transfer
          if (orderData.payment_method === 'bank-transfer') {
            // Parse payment details if available in JSON format
            try {
              if (orderData.payment_details && typeof orderData.payment_details === 'string') {
                const parsedDetails = JSON.parse(orderData.payment_details);
                setPaymentDetails(parsedDetails);
              } else {
                // Fallback to the selected bank if available
                const selectedBankDetails = bankAccounts.find(b => b.bank === selectedBank);
                setPaymentDetails(selectedBankDetails || {
                  bank: 'SeaBank',
                  accountNumber: '901958730549',
                  accountName: 'Jaya Perkasa Charcoal'
                });
              }
            } catch (e) {
              console.error('Error parsing payment details:', e);
              // Fallback to default bank details
              setPaymentDetails({
                bank: 'SeaBank',
                accountNumber: '901958730549',
                accountName: 'Jaya Perkasa Charcoal'
              });
            }
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
          toast({
            title: "Error",
            description: "Gagal memuat detail pesanan. Silakan coba lagi nanti.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
      
      fetchOrderDetails();
    }, [completedOrderData.id]);
    
    if (isLoading) {
      return (
        <div className="p-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Memuat detail pesanan...</p>
        </div>
      );
    }
    
    return (
      <div id="order-completed-details" className="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BadgeCheck className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-green-700">Pesanan Berhasil!</h2>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h3 className="font-bold text-lg mb-2">Detail Pesanan #{completedOrderData.id}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded">Baru</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal:</span>
              <span>{new Date().toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">{formatRupiah(completedOrderData.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metode Pembayaran:</span>
              <span>{translatePaymentMethod(completedOrderData.payment_method)}</span>
            </div>
          </div>
        </div>
        
        {/* Items in the order */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h3 className="font-bold mb-2">Item Pesanan</h3>
          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} x {formatRupiah(item.price)}
                      {item.variant && <span className="ml-1">({item.variant})</span>}
                    </div>
                  </div>
                </div>
                <div className="font-medium">{formatRupiah(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Shipping information */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h3 className="font-bold mb-2">Informasi Pengiriman</h3>
          {shippingAddress && (
            <div className="mb-3">
              <div className="font-medium">{shippingAddress.recipient_name || shippingAddress.name}</div>
              <div className="text-sm text-muted-foreground">
                {shippingAddress.street}, 
                {shippingAddress.district && `${shippingAddress.district}, `}
                {shippingAddress.city}, 
                {shippingAddress.province} 
                {shippingAddress.postal_code}
              </div>
              <div className="text-sm text-muted-foreground">{shippingAddress.recipient_phone || shippingAddress.phone}</div>
            </div>
          )}
          
          {shippingMethodDetail && (
            <div className="flex justify-between items-center pt-2 border-t">
              <div>
                <div className="font-medium">{shippingMethodDetail.name}</div>
                <div className="text-sm text-muted-foreground">
                  {shippingMethodDetail.provider} {shippingMethodDetail.service}
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimasi {shippingMethodDetail.estimated_days || 2} jam
                </div>
              </div>
              <div className="font-medium">{formatRupiah(shippingMethodDetail.cost)}</div>
            </div>
          )}
        </div>
        
        {/* Payment instructions if bank transfer */}
        {orderDetail?.payment_method === 'bank-transfer' && paymentDetails && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="font-bold mb-2">Instruksi Pembayaran</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Bank:</div>
                <div className="font-medium">{paymentDetails.bank || paymentDetails.bank_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nomor Rekening:</div>
                <div className="font-medium">{paymentDetails.accountNumber || paymentDetails.account_number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Atas Nama:</div>
                <div className="font-medium">{paymentDetails.accountName || paymentDetails.account_name || 'Jaya Perkasa Charcoal'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Jumlah:</div>
                <div className="font-bold text-lg">{formatRupiah(orderDetail.total)}</div>
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                Silakan lakukan pembayaran dalam waktu 24 jam. Setelah melakukan pembayaran, pesanan Anda akan diproses.
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/')} 
            className="bg-flame-500 hover:bg-flame-600 w-full"
          >
            Lanjutkan Belanja
          </Button>
          <Button 
            onClick={() => navigate(`/order/${completedOrderData.id}`)} 
            variant="outline" 
            className="w-full"
          >
            Lihat Detail Pesanan
          </Button>
        </div>
      </div>
    );
  };
  
  // If order is completed, show only the order details
  if (orderCompleted && completedOrderData) {
    return (
      <MobileLayout>
        <div className="p-4 flex items-center justify-between shadow-sm mb-4">
          <Link to="/" className="text-charcoal-600 flex items-center">
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-xl font-bold text-center flex-1 pr-6">Detail Pesanan</h1>
          <div className="w-8"></div>
        </div>
        <OrderCompletedDetails />
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout>
      <div className="pb-28">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background p-4 flex items-center justify-between shadow-sm">
          <Link to="/cart" className="text-charcoal-600 flex items-center">
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Kembali ke Keranjang</span>
          </Link>
          <h1 className="text-xl font-bold text-center flex-1 pr-6">Checkout</h1>
          <div className="w-8"></div> {/* For balance */}
        </div>
        
        <div className="p-4">
          {/* Shipping Address */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Alamat Pengiriman</h2>
            <RadioGroup 
              value={selectedAddressId} 
              onValueChange={setSelectedAddressId}
              className="space-y-3"
            >
              {addresses.map(address => (
                <Card 
                  key={address.id} 
                  className={`cursor-pointer border-2 ${
                    selectedAddressId === address.id 
                    ? "border-flame-500" 
                    : "border-border"
                  }`}
                  onClick={() => setSelectedAddressId(address.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem 
                        value={address.id} 
                        id={`address-${address.id}`} 
                        className="flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={`address-${address.id}`} className="font-medium cursor-pointer">
                            {address.name}
                          </Label>
                          {address.isDefault && (
                            <span className="text-xs bg-charcoal-100 text-charcoal-600 px-2 py-0.5 rounded">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.street}, {address.city}, {address.state} {address.zip}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            <div className="mt-3">
              <Link to="/address/new">
                <Button variant="outline" className="w-full text-sm">
                  <span className="mr-1">+</span> Tambah Alamat Baru
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Shipping Method */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Metode Pengiriman</h2>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
              <div className="space-y-3">
                {availableShippingMethods.map(method => (
                  <Card 
                    key={method.id} 
                    className={`cursor-pointer border-2 ${
                      shippingMethod === method.id ? "border-flame-500" : "border-border"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem 
                          value={method.id} 
                          id={`shipping-${method.id}`} 
                          className="flex-shrink-0" 
                        />
                        <div className="flex justify-between w-full">
                          <Label htmlFor={`shipping-${method.id}`} className="cursor-pointer">
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.estimated_days} Jam kerja
                            </div>
                          </Label>
                          <div className="font-medium">{formatRupiah(method.cost)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
          
          {/* Payment Method */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Metode Pembayaran</h2>
            <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
              <div className="space-y-3">
                <Card className={`cursor-pointer border-2 ${
                  paymentMethod === "bank-transfer" ? "border-flame-500" : "border-border"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="bank-transfer" id="bank-transfer" className="flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-flame-500" />
                        <Label htmlFor="bank-transfer" className="cursor-pointer">
                          Transfer Bank
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer border-2 ${
                  paymentMethod === "cod" ? "border-flame-500" : "border-border"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="cod" id="cod" className="flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-flame-500" />
                        <Label htmlFor="cod" className="cursor-pointer">
                          Bayar di Tempat (COD)
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer border-2 ${
                  paymentMethod === "qris" ? "border-flame-500" : "border-border"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="qris" id="qris" className="flex-shrink-0" />
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-flame-500" />
                        <Label htmlFor="qris" className="cursor-pointer">
                          QRIS
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>

            {/* Show bank details if bank transfer is selected */}
            {paymentMethod === "bank-transfer" && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Pilih Bank</h3>
                <RadioGroup value={selectedBank} onValueChange={setSelectedBank} className="space-y-2">
                  {bankAccounts.map((account) => (
                    <div key={account.bank} className="flex items-center space-x-2">
                      <RadioGroupItem value={account.bank} id={`bank-${account.bank}`} />
                      <Label htmlFor={`bank-${account.bank}`}>{account.bank}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                <div className="mt-3 p-3 bg-background rounded border">
                  {bankAccounts.find(account => account.bank === selectedBank) && (
                    <>
                      <p className="font-medium">Detail Rekening:</p>
                      <p className="mt-1">Bank: {selectedBank}</p>
                      <p>No. Rekening: {bankAccounts.find(acc => acc.bank === selectedBank)?.accountNumber}</p>
                      <p>Atas Nama: {bankAccounts.find(acc => acc.bank === selectedBank)?.accountName}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Show QRIS code if QRIS is selected */}
            {paymentMethod === "qris" && (
              <div className="mt-4 p-4 bg-muted rounded-md text-center">
                <h3 className="font-medium mb-2">Scan QRIS</h3>
                <div className="bg-white p-3 inline-block mx-auto rounded-lg">
                  <img 
                    src="https://jayaperkasacharcoal.co-id.id/qr-code.jpg" 
                    alt="Kode QRIS" 
                    className="w-48 h-48 mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://jayaperkasacharcoal.co-id.id/qr-code.jpg";
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Scan kode QR menggunakan aplikasi DANA atau e-wallet lainnya
                </p>
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Ringkasan Pesanan</h2>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3 mb-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{item.name}</span>
                        <div className="text-xs text-muted-foreground">
                          Qty: {item.quantity} x {formatRupiah(item.price)}
                        </div>
                      </div>
                      <div className="font-medium text-right">
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatRupiah(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pengiriman</span>
                    <span className="font-medium">{formatRupiah(shippingCost)}</span>
                  </div>
                  
                  {/* Voucher Input dan Display */}
                  {!appliedVoucher ? (
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-grow">
                        <Ticket className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Masukkan kode voucher"
                          className="pl-8"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          disabled={voucherLoading}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading || !voucherCode.trim()}
                        className="shrink-0"
                      >
                        {voucherLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          "Terapkan"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                      <div className="flex items-center">
                        <BadgeCheck className="h-4 w-4 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium">{appliedVoucher.code}</p>
                          <p className="text-xs text-gray-500">
                            {appliedVoucher.discount_type === "percentage" 
                              ? `Diskon ${appliedVoucher.discount_value}%` 
                              : `Diskon ${formatRupiah(appliedVoucher.discount_value)}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-green-600 mr-2">-{formatRupiah(discountAmount)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50"
                          onClick={handleRemoveVoucher}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {appliedVoucher && (
                    <div className="flex justify-between text-sm mt-2">
                      <span>Subtotal setelah diskon</span>
                      <span className="font-medium">{formatRupiah(totalWithDiscount)}</span>
                    </div>
                  )}
                  
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">{formatRupiah(totalWithShipping)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Fixed Footer - Increased z-index to appear above the bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-background border-t p-4 z-20">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-xl">{formatRupiah(totalWithShipping)}</span>
          </div>
          <Button 
            onClick={handlePlaceOrder} 
            className="w-full bg-flame-500 hover:bg-flame-600"
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : "Buat Pesanan"}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default CheckoutPage;
