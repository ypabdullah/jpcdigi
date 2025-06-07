import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { sendOrderNotificationToAdmins } from '@/integrations/firebase/notification-service';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function TestOrderNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [orderTotal, setOrderTotal] = useState(750000);
  const [useDummyData, setUseDummyData] = useState(true);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'denied' | 'granted' | null>(null);
  
  // Check notification permission on component mount
  useEffect(() => {
    const checkNotificationPermission = () => {
      if (!('Notification' in window)) {
        setNotificationPermission(null);
        return;
      }
      
      setNotificationPermission(Notification.permission as 'default' | 'denied' | 'granted');
    };
    
    checkNotificationPermission();
  }, []);
  
  // Fetch some products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(5);
      
      if (data && data.length > 0) {
        setAvailableProducts(data);
      } else {
        // Use dummy products if none found in database
        setAvailableProducts([
          { id: uuidv4(), name: 'Coal Type A Premium', price: 250000 },
          { id: uuidv4(), name: 'Coal Type B Standard', price: 180000 },
          { id: uuidv4(), name: 'Coal Type C Economy', price: 120000 }
        ]);
      }
    };

    fetchProducts();
  }, []);
  
  // Function to request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Error',
        description: 'Browser Anda tidak mendukung notifikasi',
        variant: 'destructive'
      });
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission as 'default' | 'denied' | 'granted');
      
      if (permission === 'granted') {
        toast({
          title: 'Sukses',
          description: 'Izin notifikasi diberikan',
        });
        return true;
      } else {
        toast({
          title: 'Peringatan',
          description: 'Izin notifikasi ditolak. Notifikasi tidak akan ditampilkan.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Gagal meminta izin notifikasi',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Function to create a test order with real or dummy data
  const createTestOrder = async () => {
    setIsLoading(true);
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      toast({
        title: 'Error',
        description: 'Browser Anda tidak mendukung notifikasi',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }
    
    // Request notification permission if not granted
    if (notificationPermission !== 'granted') {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        toast({
          title: 'Peringatan',
          description: 'Anda harus mengizinkan notifikasi untuk menguji fitur ini',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
    }
    
    try {
      let orderData;
      let customerData;
      let orderItems = [];
      
      if (useDummyData) {
        // Use dummy data for testing
        const dummyOrderId = uuidv4();
        const dummyUserId = customerId || uuidv4();
        const dummyAddressId = uuidv4();
        
        // Create dummy customer data
        customerData = {
          id: dummyUserId,
          full_name: 'Pelanggan Test',
          email: 'test@example.com',
          phone: '081234567890'
        };
        
        // Prepare order data with dummy information
        orderData = {
          id: dummyOrderId,
          user_id: dummyUserId,
          total: orderTotal,
          status: 'pending',
          payment_method: 'bank-transfer',
          shipping_address_id: dummyAddressId,
          date: new Date().toISOString(),
          payment_details: 'SeaBank'
        };
        
        // Create dummy order items
        for (const product of availableProducts.slice(0, 3)) {
          const quantity = Math.floor(Math.random() * 3) + 1; // Random quantity between 1-3
          orderItems.push({
            product_name: product.name,
            quantity: quantity,
            price: product.price
          });
        }
        
        console.log('Using dummy order data for testing:', {
          order: orderData,
          customer: customerData,
          items: orderItems
        });
      } else {
        // Try to use real data if user wants it and provided a customer ID
        if (!customerId) {
          throw new Error('Silahkan masukkan ID pelanggan untuk menggunakan data nyata');
        }
        
        // Get customer data
        const { data: realCustomerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', customerId)
          .single();
  
        if (customerError || !realCustomerData) {
          throw new Error('Pelanggan tidak ditemukan. Gunakan opsi "Gunakan Data Dummy" untuk testing.');
        }
        
        customerData = realCustomerData;
        
        // Get a random address for the customer or create dummy one
        let addressId;
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', customerId)
          .limit(1)
          .single();
  
        if (addressError) {
          // Create temporary address if not found
          addressId = uuidv4();
          console.log('Using dummy address ID:', addressId);
        } else {
          addressId = addressData.id;
        }
        
        // Create a real order in the database
        const { data: realOrderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: customerId,
            total: orderTotal,
            status: 'pending',
            payment_method: 'bank-transfer',
            shipping_address_id: addressId,
            date: new Date().toISOString(),
            payment_details: 'SeaBank'
          })
          .select()
          .single();
  
        if (orderError) {
          throw orderError;
        }
        
        orderData = realOrderData;
        
        // Create order items
        for (const product of availableProducts.slice(0, 3)) {
          const quantity = Math.floor(Math.random() * 3) + 1; // Random quantity between 1-3
          
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderData.id,
              product_id: product.id,
              product_name: product.name,
              quantity: quantity,
              price: product.price
            });
  
          if (itemError) {
            console.error('Error inserting order item:', itemError);
          } else {
            orderItems.push({
              product_name: product.name,
              quantity: quantity,
              price: product.price
            });
          }
        }
      }

      // Send notification to admins using the prepared data
      await sendOrderNotificationToAdmins({
        ...orderData,
        _customerData: customerData, // Add customer data for notification
        _orderItems: orderItems // Add order items for notification
      });

      toast({
        title: 'Sukses',
        description: `Notifikasi order berhasil dikirim ke admin. Order ID: ${orderData.id}`,
      });

      console.log('Test order created:', {
        order: orderData,
        customer: customerData,
        items: orderItems
      });

    } catch (error) {
      console.error('Error creating test order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal membuat order test',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Notifikasi Order</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Notification Permission Status */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 mb-4">
            <div className="space-y-0.5">
              <Label>Status Izin Notifikasi</Label>
              <p className="text-sm">
                {!('Notification' in window) ? (
                  <span className="text-red-500">Browser tidak mendukung notifikasi</span>
                ) : notificationPermission === 'granted' ? (
                  <span className="text-green-500">Izin diberikan</span>
                ) : notificationPermission === 'denied' ? (
                  <span className="text-red-500">Izin ditolak (buka pengaturan browser untuk mengizinkan)</span>
                ) : (
                  <span className="text-amber-500">Izin belum diminta</span>
                )}
              </p>
            </div>
            {('Notification' in window) && notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={requestNotificationPermission}
                disabled={isLoading}
              >
                Minta Izin
              </Button>
            )}
          </div>
          
          {/* Use Dummy Data Toggle */}
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 mb-4">
            <div className="space-y-0.5">
              <Label>Gunakan Data Dummy</Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan untuk menggunakan data dummy tanpa perlu data pelanggan nyata
              </p>
            </div>
            <Switch
              checked={useDummyData}
              onCheckedChange={setUseDummyData}
            />
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="customerId">
              {useDummyData ? "ID Pelanggan (Opsional)" : "ID Pelanggan"}
            </Label>
            <Input
              id="customerId"
              placeholder={useDummyData ? "Opsional - akan dibuat otomatis jika kosong" : "Masukkan ID pelanggan"}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={isLoading}
            />
            {!useDummyData && (
              <p className="text-xs text-muted-foreground">
                ID pelanggan wajib diisi jika tidak menggunakan data dummy
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orderTotal">Total Order (Rp)</Label>
            <Input
              id="orderTotal"
              type="number"
              value={orderTotal}
              onChange={(e) => setOrderTotal(Number(e.target.value))}
              min={10000}
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={createTestOrder} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Kirim Notifikasi Order'
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Notifikasi akan muncul di notification bar browser jika izin notifikasi telah diberikan
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
