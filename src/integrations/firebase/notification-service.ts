// Simplified notification service that only uses WhatsApp for notifications
// All Firebase/Firestore functionality has been removed to avoid API errors
import { sendOrderNotificationToAllAdmins } from '../whatsapp/api';
import { supabase } from '../supabase/client';

/**
 * Enhanced order data type with additional fields that might be present
 */
export interface EnhancedOrderData {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_method: string;
  shipping_address_id: string;
  payment_details?: string;
  date?: string;
  payment_method_id?: string;
  shipping_method_id?: string;
  discount_code?: string;
  discount_data?: any;
  shipping_cost?: number;
  shipping_provider?: string;
  shipping_service?: string;
  shipping_estimate?: string;
  payment_status?: string;
  created_at?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * Send order notification to all admin users via WhatsApp only
 * Firebase/Firestore notifications have been disabled due to API errors
 */
export const sendOrderNotificationToAdmins = async (orderData: EnhancedOrderData): Promise<boolean> => {
  try {
    console.log('Starting admin notification via WhatsApp (Firebase disabled)');
    
    // Get all the data needed for the WhatsApp message
    try {
      // Get shipping method
      const shippingId = orderData.shipping_method_id || '';
      const { data: shippingMethod } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('id', shippingId)
        .single();
      
      // Get customer data
      const { data: userData } = await supabase
        .from('profiles')
        .select('name, phone, email')
        .eq('id', orderData.user_id)
        .single();
        
      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);
        
      // Get shipping address
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', orderData.shipping_address_id)
        .single();
        
      // Get payment method data if available
      let paymentMethodData = null;
      if (orderData.payment_method === 'bank-transfer' && orderData.payment_details) {
        // It could be just the bank name or a JSON string with more details
        try {
          paymentMethodData = typeof orderData.payment_details === 'string' 
            ? JSON.parse(orderData.payment_details) 
            : orderData.payment_details;
        } catch (e) {
          // If it's not valid JSON, use it as the bank name
          paymentMethodData = { bank_name: orderData.payment_details };
        }
      }
      
      // Send WhatsApp notification to all admins
      const whatsappResult = await sendOrderNotificationToAllAdmins(
        orderData,
        userData || { name: 'Unknown Customer', phone: 'N/A', email: 'N/A' },
        addressData || { street: 'N/A', city: 'N/A' },
        orderItems || [],
        shippingMethod || { name: 'Standard Shipping', cost: 0 },
        paymentMethodData
      );
      
      console.log(`WhatsApp notification to admins: ${whatsappResult ? 'success' : 'failed'}`);
      return whatsappResult;
      
    } catch (whatsappError) {
      console.error('Error sending WhatsApp notification to admins:', whatsappError);
      return false;
    }
  } catch (error) {
    console.error('Error in admin notification process:', error);
    return false;
  }
};

/**
 * Stub function to maintain backward compatibility
 * All Firebase/FCM functionality has been disabled
 */
export const storeFCMToken = async (userId: string, token: string): Promise<boolean> => {
  console.log('FCM token storage disabled - using WhatsApp notifications only');
  return false;
};

/**
 * Stub function to maintain backward compatibility
 * All Firebase/FCM functionality has been disabled
 */
export const registerForNotifications = async (userId: string): Promise<string | null> => {
  console.log('Firebase notifications disabled - using WhatsApp notifications only');
  return null;
};
