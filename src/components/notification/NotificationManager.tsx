import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  registerForNotifications, 
  OrderNotification 
} from '@/integrations/firebase/notification-service';
import { getMessaging, onMessage } from 'firebase/messaging';
import { firebaseApp, isNotificationSupported } from '@/integrations/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

interface NotificationManagerProps {
  children?: React.ReactNode;
}

export function NotificationManager({ children }: NotificationManagerProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  
  // Request notification permission and register for FCM
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Check if this is an admin user
        if (!user || !profile || profile.role !== 'admin') {
          console.log('Not an admin user, skipping notification setup');
          return;
        }
        
        // Check if browser supports notifications
        if (!isNotificationSupported()) {
          console.log('This browser does not support notifications');
          setPermissionGranted(false);
          return;
        }
        
        // Check if permission already granted - only run this code if notifications are supported
        try {
          if (Notification.permission === 'granted') {
            setPermissionGranted(true);
          } else if (Notification.permission === 'denied') {
            setPermissionGranted(false);
            return;
          }
        } catch (err) {
          console.error('Error accessing Notification API:', err);
          setPermissionGranted(false);
          return;
        }
        
        // Register for notifications
        const token = await registerForNotifications(user.id);
        if (token) {
          console.log('FCM Token registered:', token);
          setPermissionGranted(true);
        } else {
          console.log('Failed to get FCM token');
          setPermissionGranted(false);
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
        setPermissionGranted(false);
      }
    };
    
    setupNotifications();
  }, [user, profile]);
  
  // Listen for foreground messages
  useEffect(() => {
    if (!user || !permissionGranted) return;
    
    const messaging = getMessaging(firebaseApp);
    
    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Extract notification data
      const notificationData = payload.data as unknown as OrderNotification;
      
      if (notificationData && notificationData.type === 'order') {
        // Update local state with new notification
        setNotifications(prev => [notificationData, ...prev]);
        
        // Show toast notification
        toast({
          title: notificationData.title || 'Pesanan Baru',
          description: notificationData.message || 'Ada pesanan baru dari pelanggan',
          variant: 'default',
          action: (
            <button 
              onClick={() => navigate(`/admin/orders/${notificationData.orderId}`)}
              className="px-3 py-2 bg-flame-500 text-white rounded-md text-xs"
            >
              Lihat
            </button>
          ),
        });
        
        // Play notification sound
        const audio = new Audio('/sounds/new_order_sound.mp3');
        audio.play().catch(e => console.log('Error playing notification sound:', e));
      }
    });
    
    return () => unsubscribe();
  }, [user, permissionGranted, toast, navigate]);
  
  // Component doesn't render anything visible
  return <>{children}</>;
}
