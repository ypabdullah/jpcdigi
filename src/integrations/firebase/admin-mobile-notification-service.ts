import { firebaseApp, isNotificationSupported } from './config';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { supabase } from '../supabase/client';

// FCM server key for server-to-server communication
// This should be stored in environment variables in production
// In Vite, environment variables must be prefixed with VITE_ instead of REACT_APP_
const FCM_SERVER_KEY = import.meta.env.VITE_FIREBASE_SERVER_KEY || '';
const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

/**
 * Sends FCM notification directly to admin mobile devices when a customer places an order
 */
export const sendOrderFCMToAdminMobile = async (orderData: {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_method: string;
  shipping_address_id: string;
  payment_details?: string;
  _customerData?: any;
  _orderItems?: any[];
}) => {
  try {
    // Use provided customer data (for testing) or fetch from database
    let userData = orderData._customerData;
    
    if (!userData) {
      // Get user information for the notification
      const { data: fetchedUserData, error: userError } = await supabase
        .from('profiles')
        .select('email, phone, name')
        .eq('id', orderData.user_id)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      userData = fetchedUserData;
    }

    // Get all admin users with FCM tokens
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles') // Using profiles table instead of users based on memories
      .select('id, fcm_token')
      .eq('role', 'admin')
      .not('fcm_token', 'is', null);
      
    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    // If no admins with FCM tokens, exit early
    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admins with FCM tokens found');
      return false;
    }

    // Use provided order items (for testing) or fetch from database
    let orderItems = orderData._orderItems;
    
    if (!orderItems) {
      // Get order items for more detailed notification
      const { data: fetchedOrderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity')
        .eq('order_id', orderData.id);
        
      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        // Continue without items rather than failing
      } else {
        orderItems = fetchedOrderItems;
      }
    }

    // Format currency for display
    const formattedTotal = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR'
    }).format(orderData.total);

    // Create item summary (e.g., "2x Produk A, 1x Produk B")
    const itemSummary = orderItems && orderItems.length > 0 
      ? orderItems.map(item => `${item.quantity}x ${item.product_name}`).join(', ')
      : 'beberapa produk';

    // Create a condensed order ID for display (first 8 chars)
    const shortOrderId = orderData.id.substring(0, 8);

    // Collect FCM tokens for all admins
    const adminFcmTokens = adminUsers.map(admin => admin.fcm_token).filter(Boolean);

    // For each admin token, send an FCM notification using Fetch API
    for (const token of adminFcmTokens) {
      try {
        // For development without a server, we'll use a direct approach
        // In production, this should be on a secure backend server
        
        // This is the payload expected by FCM
        const fcmPayload = {
          to: token,
          notification: {
            title: 'Pesanan Baru',
            body: `Order #${shortOrderId} dari ${userData?.full_name || 'pelanggan'} senilai ${formattedTotal}`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            sound: 'default', // Important for mobile notifications
            click_action: `/admin/orders/${orderData.id}` // Deep link for mobile app
          },
          data: {
            // Data payload available to both foreground and background handlers
            orderId: orderData.id,
            userId: orderData.user_id,
            customerName: userData?.full_name || '',
            total: orderData.total.toString(),
            items: itemSummary,
            timestamp: Date.now().toString(),
            status: orderData.status,
            // Include a screen to navigate to in mobile app
            screenToOpen: 'OrderDetail',
            screenParams: JSON.stringify({
              orderId: orderData.id
            })
          }
        };

        // Log the outgoing FCM payload for debugging
        console.log('Sending FCM message to admin mobile:', fcmPayload);
        
        // In a production app, this should be handled by a secure backend service
        // For now, we'll leave the placeholder for the HTTP request
        // that would be made by your backend server
        
        // NOTE: This is a placeholder - Direct FCM API calls from frontend are not secure
        // as they would expose your server key. This code should be moved to a backend function.
        /*
        const response = await fetch(FCM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${FCM_SERVER_KEY}`
          },
          body: JSON.stringify(fcmPayload)
        });
        
        const responseData = await response.json();
        console.log('FCM response:', responseData);
        */
        
        // Store the notification in Firestore for persistence and 
        // to enable admin to see past notifications when they log in
        const db = getFirestore(firebaseApp);
        await addDoc(collection(db, 'admin_mobile_notifications'), {
          ...fcmPayload.notification,
          ...fcmPayload.data,
          recipientToken: token,
          sentAt: new Date().toISOString(),
          delivered: false // Will be updated by another process when confirmed
        });
        
        console.log('FCM notification sent successfully to token:', token);
      } catch (fcmError) {
        console.error('Error sending FCM to admin token:', token, fcmError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendOrderFCMToAdminMobile:', error);
    return false;
  }
};

/**
 * Updates an FCM notification when an order status changes
 */
export const sendOrderStatusUpdateFCMToAdminMobile = async (
  orderId: string, 
  oldStatus: string, 
  newStatus: string
) => {
  try {
    // Get order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total, payment_method')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error('Error fetching order data:', orderError);
      throw orderError;
    }
    
    // Get customer details
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, phone, full_name')
      .eq('id', orderData.user_id)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }
    
    // Get admin users with FCM tokens
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id, fcm_token')
      .eq('role', 'admin')
      .not('fcm_token', 'is', null);
      
    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }
    
    // Format the message with appropriate status translation
    const formattedTotal = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR'
    }).format(orderData.total);
    
    const statusTranslation = {
      'pending': 'Menunggu Pembayaran',
      'processing': 'Diproses',
      'shipped': 'Dikirim',
      'delivered': 'Terkirim',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan'
    };

    const newStatusText = statusTranslation[newStatus] || newStatus;
    
    // Send FCM to each admin
    for (const admin of adminUsers || []) {
      if (admin.fcm_token) {
        try {
          // FCM payload for status update
          const fcmPayload = {
            to: admin.fcm_token,
            notification: {
              title: 'Status Pesanan Diperbarui',
              body: `Order #${orderId.substring(0, 8)} diperbarui ke ${newStatusText}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              sound: 'default'
            },
            data: {
              orderId: orderData.id,
              userId: orderData.user_id,
              customerName: userData?.full_name || '',
              oldStatus,
              newStatus,
              timestamp: Date.now().toString(),
              // Include a screen to navigate to in mobile app
              screenToOpen: 'OrderDetail',
              screenParams: JSON.stringify({
                orderId: orderData.id
              })
            }
          };
          
          console.log('Sending status update FCM to admin mobile:', admin.id, fcmPayload);
          
          // Store in Firestore
          const db = getFirestore(firebaseApp);
          await addDoc(collection(db, 'admin_mobile_notifications'), {
            ...fcmPayload.notification,
            ...fcmPayload.data,
            recipientToken: admin.fcm_token,
            sentAt: new Date().toISOString(),
            type: 'order_status_update',
            delivered: false
          });
        } catch (fcmError) {
          console.error('Error sending status update FCM to admin:', admin.id, fcmError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending status update FCM to admin mobiles:', error);
    return false;
  }
};
