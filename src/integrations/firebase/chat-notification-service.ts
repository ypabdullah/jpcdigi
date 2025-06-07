import { firebaseApp } from './config';
import { getAdminPhoneNumbers, sendWhatsAppMessage } from '../whatsapp/api';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { supabase } from '../supabase/client';
import { isNotificationSupported } from './config';

// Helper function to safely check notification permission
const getNotificationPermission = (): 'granted' | 'denied' | 'default' => {
  if (!isNotificationSupported()) {
    return 'default'; // Return default as fallback for unsupported browsers
  }
  return Notification.permission;
};

// Initialize Firestore
const db = getFirestore(firebaseApp);

// Interface for chat notifications
export interface ChatNotification {
  type: 'chat';
  title: string;
  message: string;
  sessionId: string;
  customerId: string;
  customerName: string;
  timestamp: number;
  isRead: boolean;
}

/**
 * Sends a notification to all admin users when a customer sends a new message
 */
export const sendChatNotificationToAdmins = async (messageData: {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}) => {
  // Only send notifications for messages from customers
  if (messageData.sender_type !== 'customer') {
    return false;
  }

  try {
    // Get customer information
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', messageData.sender_id)
      .single();
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      throw customerError;
    }

    // Get session information
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('admin_id')
      .eq('id', messageData.session_id)
      .single();
    
    if (sessionError) {
      console.error('Error fetching session data:', sessionError);
      throw sessionError;
    }

    // Create notification data
    const notification: ChatNotification = {
      type: 'chat',
      title: 'Pesan Baru',
      message: `${customerData?.name || 'Pelanggan'}: ${messageData.content.substring(0, 50)}${messageData.content.length > 50 ? '...' : ''}`,
      sessionId: messageData.session_id,
      customerId: messageData.sender_id,
      customerName: customerData?.name || 'Pelanggan',
      timestamp: Date.now(),
      isRead: false
    };
    
    // If this session has a specific admin assigned, notify only that admin
    if (sessionData?.admin_id) {
      const { data: admin, error: adminError } = await supabase
        .from('profiles')
        .select('id, fcm_token')
        .eq('id', sessionData.admin_id)
        .single();
        
      if (adminError) {
        console.error('Error fetching admin data:', adminError);
        throw adminError;
      }
      
      if (admin?.fcm_token) {
        // Add notification to Firestore
        await addDoc(collection(db, 'notifications'), {
          ...notification,
          recipientId: admin.id,
          fcmToken: admin.fcm_token,
        });
        
        console.log('Chat notification sent to assigned admin', notification);
        return true;
      }
    }
    
    // Get all admin users if no specific admin is assigned or admin has no FCM token
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('id, fcm_token')
      .eq('role', 'admin');
      
    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }
    
    // Save notification to Firestore for each admin
    const batch = [];
    for (const admin of adminUsers || []) {
      if (admin.fcm_token) {
        // Add notification to Firestore
        batch.push(
          addDoc(collection(db, 'notifications'), {
            ...notification,
            recipientId: admin.id,
            fcmToken: admin.fcm_token,
          })
        );
      }
    }
    
    await Promise.all(batch);
    
    // Send WhatsApp notifications to admins
    try {
      // Get admin phone numbers from database
      const adminPhoneNumbers = await getAdminPhoneNumbers();
      
      if (adminPhoneNumbers && adminPhoneNumbers.length > 0) {
        console.log(`Sending WhatsApp notifications to ${adminPhoneNumbers.length} admins`);
        
        // Create the WhatsApp message with rich information
        const appUrl = window.location.origin;
        const chatUrl = `${appUrl}/admin/chat?session=${messageData.session_id}`;
        
        // Create a clear, informative message
        const whatsappMessage = `📨 Pesan baru dari ${notification.customerName}:\n"${messageData.content.substring(0, 100)}${messageData.content.length > 100 ? '...' : ''}"\n\nKlik untuk melihat: ${chatUrl}`;
        
        // Send to each admin with a phone number
        const whatsappPromises = adminPhoneNumbers.map(phone => {
          return sendWhatsAppMessage(phone, whatsappMessage);
        });
        
        await Promise.all(whatsappPromises);
        console.log('WhatsApp notifications sent to admins');
      } else {
        console.log('No admin phone numbers found for WhatsApp notifications');
      }
    } catch (whatsappError) {
      console.error('Error sending WhatsApp notifications:', whatsappError);
      // Non-critical error, continue with other notifications
    }
    
    console.log('Chat notification sent to all admins', notification);
    return true;
  } catch (error) {
    console.error('Error sending chat notification:', error);
    return false;
  }
};
