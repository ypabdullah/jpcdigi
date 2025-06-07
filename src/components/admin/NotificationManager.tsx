import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { requestFCMToken, setupMessageListener } from "@/integrations/firebase/config";
import { registerForNotifications } from "@/integrations/firebase/notification-service";
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

interface NotificationManagerProps {
  className?: string;
}

export function NotificationManager({ className = '' }: NotificationManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  // Initialize Firebase messaging when component mounts
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const checkNotificationPermission = async () => {
      // Check if notifications are already enabled
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        
        // Register for notifications if already granted
        try {
          const token = await registerForNotifications(user.id);
          if (token) {
            console.log('FCM token registered for admin:', token);
            
            // Setup message listener for foreground notifications
            setupMessageListener((payload) => {
              console.log('Foreground notification received:', payload);
              
              // Show toast notification for foreground messages
              if (payload.notification) {
                toast({
                  title: payload.notification.title || 'Notifikasi Baru',
                  description: payload.notification.body || 'Anda menerima notifikasi baru',
                  variant: "default"
                });
                
                // Play notification sound
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log('Error playing notification sound:', e));
              }
            });
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      } else {
        setNotificationsEnabled(false);
      }
    };
    
    checkNotificationPermission();
    
  }, [user]);
  
  // Handle enabling notifications
  const handleEnableNotifications = async () => {
    if (!user) return;
    
    try {
      const token = await requestFCMToken();
      if (token) {
        await registerForNotifications(user.id);
        setNotificationsEnabled(true);
        
        toast({
          title: "Notifikasi Diaktifkan",
          description: "Anda akan menerima notifikasi saat ada pesanan baru",
          variant: "default"
        });
        
        // Reload to apply service worker changes
        window.location.reload();
      } else {
        toast({
          title: "Gagal Mengaktifkan Notifikasi",
          description: "Silakan coba lagi atau periksa pengaturan browser Anda",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Gagal mengaktifkan notifikasi",
        variant: "destructive"
      });
    }
  };

  // Only render for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return (
    <div className={className}>
      {!notificationsEnabled ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEnableNotifications}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          <span>Aktifkan Notifikasi</span>
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="text-green-600">
          <Bell className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
