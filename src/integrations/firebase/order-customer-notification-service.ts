import { firebaseApp, isNotificationSupported } from './config';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { supabase } from '../supabase/client';
import { sendOrderNotificationToCustomer as sendWhatsAppOrderNotification, sendOrderNotificationToAllAdmins as sendWhatsAppToAdmins } from '../whatsapp/api';

// Helper function to safely check notification permission
const getNotificationPermission = (): 'granted' | 'denied' | 'default' => {
  if (!isNotificationSupported()) {
    return 'default'; // Return default as fallback for unsupported browsers
  }
  return Notification.permission;
};

// Initialize Firestore
const db = getFirestore(firebaseApp);

// Interface for customer order notifications
export interface CustomerOrderNotification {
  type: 'customer_order';
  title: string;
  message: string;
  orderId: string;
  userId: string;
  totalAmount: number;
  timestamp: number;
  isRead: boolean;
  status: string;
}

/**
 * Sends an order notification to the customer who placed the order
 */
export const sendOrderNotificationToCustomer = async (orderData: {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_method: string;
  shipping_address_id: string;
  payment_details?: string;
  date?: string;
}) => {
  try {
    // Get customer information focusing only on the data needed for WhatsApp
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('name, email, phone')
      .eq('id', orderData.user_id)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      throw customerError;
    }
    
    // Skip Firebase/Firestore notifications due to API errors
    console.log('Skipping Firebase notifications due to API configuration issues');
    
    // We'll use only WhatsApp notifications instead
    
    // Get order data for WhatsApp notifications
    try {
      
      // Get complete order data
      const completeOrderData = {...orderData};
      
      // Get shipping address information
      let addressData = { street: 'N/A', city: 'N/A', province: 'N/A', postal_code: 'N/A' };
      
      if (orderData.shipping_address_id) {
        const { data: address, error: addressError } = await supabase
          .from('addresses')
          .select('street, city, province, postal_code, district, recipient_name, recipient_phone')
          .eq('id', orderData.shipping_address_id)
          .single();
        
        if (!addressError && address) {
          addressData = address;
        }
      }
      
      // Get shipping details
      let shippingData = { name: 'JPC Delivery', cost: 0, provider: 'JPC', service: 'Regular' };
      // Safely check for shipping data - it might be in different fields depending on the schema
      const shippingId = (orderData as any).shipping_id || (orderData as any).shipping_method_id;
      if (shippingId) {
        const { data: shipping, error: shippingError } = await supabase
          .from('shipping_methods')
          .select('name, provider, service, cost')
          .eq('id', shippingId)
          .single();
          
        if (!shippingError && shipping) {
          shippingData = shipping;
          (completeOrderData as any).shipping_cost = shipping.cost;
        }
      }
      
      // Get discount details if any
      let discountData = null;
      const discountId = (orderData as any).discount_id || (orderData as any).voucher_id;
      if (discountId) {
        const { data: discount, error: discountError } = await supabase
          .from('discounts')
          .select('code, type, value, description')
          .eq('id', discountId)
          .single();
          
        if (!discountError && discount) {
          discountData = discount;
          (completeOrderData as any).discount_data = discount;
        }
      }
      
      // Get payment method details
      let paymentMethodData = { name: 'Transfer Bank', bank_name: 'SeaBank', account_number: '901958730549' };
      if (orderData.payment_method) {
        // The payment method might be a string (like 'bank-transfer') or an ID reference
        const paymentMethodId = typeof orderData.payment_method === 'string' ? 
          (orderData as any).payment_method_id || '' : orderData.payment_method;
          
        if (paymentMethodId) {
          const { data: paymentMethod, error: paymentError } = await supabase
            .from('payment_methods')
            .select('name, bank_name, account_number, description')
            .eq('id', paymentMethodId)
            .single();
            
          if (!paymentError && paymentMethod) {
            paymentMethodData = paymentMethod;
          }
        }
      }
      
      // Get order items with more details
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity, price, product_id, variant, unit')
        .eq('order_id', orderData.id);
      
      // Ensure we have valid order items array
      const validOrderItems = !itemsError && Array.isArray(orderItems) ? orderItems : [];
      
      // Log complete data being sent
      console.log('WhatsApp Order Data:', {
        orderID: completeOrderData.id,
        customerPhone: customerData?.phone,
        itemsCount: validOrderItems.length,
        hasShippingData: !!shippingData,
        hasPaymentData: !!paymentMethodData
      });
      
      // Send WhatsApp notification to customer if they have a phone number
      if (customerData?.phone) {
        try {
          // Make sure we have a valid phone number to send to
          if (customerData.phone.trim() === '') {
            console.log('Customer phone number is empty, skipping WhatsApp notification');
          } else {
            // Log we're about to send WhatsApp notification
            console.log('Sending WhatsApp notification to customer:', customerData.phone);
            
            // SINGLE SOURCE OF TRUTH: This is now the only place WhatsApp notifications are sent
            // This prevents duplicate messages by having a single source
            const result = await sendWhatsAppOrderNotification(
              completeOrderData,
              customerData,
              addressData,
              validOrderItems,
              shippingData,
              paymentMethodData
            );
            
            if (result) {
              console.log('✅ WhatsApp notification sent successfully to customer:', customerData.phone);
            } else {
              console.error('❌ Failed to send WhatsApp notification to customer');
            }
          }
        } catch (customerWhatsappError) {
          console.error('Error sending WhatsApp notification to customer:', customerWhatsappError);
        }
      } else {
        console.log('Customer has no phone number, WhatsApp notification will be skipped');
      }
      
      // NOTIFIKASI ADMIN DIPINDAHKAN KE notification-service.ts
      // Menghindari pengiriman duplikat ke admin
      // Notifikasi ke admin akan dikirim otomatis oleh notification-service.ts
      console.log('Admin WhatsApp notifications will be handled by notification-service.ts to avoid duplicates');
      
      // Kode untuk mengirim notifikasi ke admin dinonaktifkan untuk menghindari duplikasi
      /*
      try {
        await sendWhatsAppToAdmins(
          completeOrderData,
          customerData,
          addressData,
          validOrderItems,
          shippingData,
          paymentMethodData
        );
        console.log('WhatsApp notifications sent to all admin numbers');
      } catch (adminWhatsappError) {
        console.error('Error sending WhatsApp notifications to admins:', adminWhatsappError);
      }
      */
    } catch (whatsappError) {
      console.error('Error in WhatsApp notification process:', whatsappError);
      // Continue execution even if WhatsApp notification fails
    }
    
    return true;
  } catch (error) {
    console.error('Error sending notification to customer:', error);
    return false;
  }
};

/**
 * Updates the customer about changes to their order status
 */
export const sendOrderStatusUpdateToCustomer = async (
  orderId: string, 
  userId: string, 
  newStatus: string, 
  totalAmount: number
) => {
  try {
    // Get customer information including FCM token
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('name, email, fcm_token')
      .eq('id', userId)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      throw customerError;
    }

    // If the customer doesn't have an FCM token, we can't send a notification
    if (!customerData?.fcm_token) {
      console.log('Customer does not have an FCM token, skipping notification');
      return false;
    }
    
    // Create notification data
    const notification: CustomerOrderNotification = {
      type: 'customer_order',
      title: 'Status Pesanan Diperbarui',
      message: `Pesanan #${orderId.slice(-6)} telah diperbarui ke status: ${getStatusInIndonesian(newStatus)}`,
      orderId: orderId,
      userId: userId,
      totalAmount: totalAmount,
      timestamp: Date.now(),
      isRead: false,
      status: newStatus
    };
    
    // Add notification to Firestore
    await addDoc(collection(db, 'customer_notifications'), {
      ...notification,
      recipientId: userId,
      fcmToken: customerData.fcm_token,
    });
    
    console.log('Order status update notification sent to customer', notification);
    return true;
  } catch (error) {
    console.error('Error sending status update notification to customer:', error);
    return false;
  }
};

// Helper function to convert status to Indonesian
function getStatusInIndonesian(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Menunggu Pembayaran',
    'processing': 'Diproses',
    'shipped': 'Dikirim',
    'delivered': 'Terkirim',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  
  return statusMap[status] || status;
}
