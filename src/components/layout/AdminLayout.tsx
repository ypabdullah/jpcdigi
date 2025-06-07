import React, { useEffect } from "react"; // Added useEffect
import { Link, useLocation, Navigate } from "react-router-dom";
import { NotificationManager } from "@/components/notification/NotificationManager";
import { 
  Database, 
  Users, 
  Package, 
  ShoppingBag, 
  BarChart, 
  Settings, 
  LogOut,
  Box,
  MessageSquare,
  Ticket,
  Megaphone,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // Added supabase
import { useSound } from "@/hooks/useSound"; // Added useSound
import type { DbOrder, ChatDbMessage } from "@/integrations/supabase/custom-types"; // Added types

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  const playNewOrderSound = useSound("/sounds/new_order_sound.mp3");
  const playNewChatMessageSound = useSound("/sounds/new_chat_message_sound.mp3");

  // Effect for new orders
  useEffect(() => {
    if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return;
    }

    const ordersChannel = supabase
      .channel('admin-new-orders')
      .on<DbOrder>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order received in AdminLayout:', payload.new);
          playNewOrderSound();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to new orders in AdminLayout');
        }
        if (err) {
          console.error('Error subscribing to orders in AdminLayout:', err);
        }
      });

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user, profile, playNewOrderSound]);

  // Effect for new chat messages
  useEffect(() => {
    if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return;
    }

    // Listen for messages sent by customers, either to this admin or unassigned (new sessions)
    const messagesChannel = supabase
      .channel('admin-new-chat-messages')
      .on<ChatDbMessage>(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          // We cannot filter by admin_id on the session directly in the subscription filter here
          // So we filter client-side based on sender_type and potentially session details if needed
        },
        async (payload) => {
          const newMessage = payload.new;
          if (newMessage.sender_type === 'customer') {
            // To avoid playing sound if the admin is actively in that chat,
            // one might check location.pathname, but that's a bit complex here.
            // For now, play sound for any new customer message.
            // More sophisticated logic could involve checking if the session's admin_id matches current admin
            // or if admin_id is null (for new sessions).
            
            // Fetch the session to check admin_id
            if (newMessage.session_id) {
              const { data: sessionData, error: sessionError } = await supabase
                .from('chat_sessions')
                .select('admin_id, customer_id')
                .eq('id', newMessage.session_id)
                .single();

              if (sessionError) {
                console.error("Error fetching session for new message notification:", sessionError);
                return;
              }
              
              // Play sound if message is for this admin, or session is unassigned (admin_id is null)
              // and the admin is not currently viewing that specific chat.
              const viewingThisChat = location.pathname === `/admin/chat/${sessionData?.customer_id}`;
              if ((sessionData && (sessionData.admin_id === user.id || sessionData.admin_id === null)) && !viewingThisChat) {
                 console.log('New chat message for admin received in AdminLayout:', payload.new);
                 playNewChatMessageSound();
              }
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to new chat messages in AdminLayout');
        }
        if (err) {
          console.error('Error subscribing to messages in AdminLayout:', err);
        }
      });
    
    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, profile, playNewChatMessageSound, location.pathname]);


  // Redirect to home if not admin or manager
  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return <Navigate to="/admin-login" replace />;
  }
  
  const menuItems = [
    { icon: <Database />, label: "Dashboard", path: "/admin" },
    { icon: <Box />, label: "Inventaris", path: "/admin/inventory" },
    { icon: <Package />, label: "Pengiriman", path: "/admin/shipping" },
    { icon: <MessageSquare />, label: "Chat", path: "/admin/chats" },
    { icon: <Users />, label: "Pengguna", path: "/admin/users" },
    { icon: <ShoppingBag />, label: "Pesanan", path: "/admin/orders" },
    { icon: <Ticket />, label: "Voucher", path: "/admin/vouchers" },
    { icon: <Megaphone />, label: "Broadcast", path: "/admin/broadcast" },
    { icon: <BarChart />, label: "Analitik", path: "/admin/analytics" },
    { icon: <Settings />, label: "Pengaturan", path: "/admin/settings" },
    { icon: <CreditCard />, label: "PPOB", path: "/admin/ppob" }
  ];
  
  return (
    <NotificationManager>
      <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        {/* Sidebar header and nav items */}
        <div className="flex items-center justify-center h-16 border-b">
          <h2 className="text-xl font-semibold text-flame-500">Panel Admin</h2>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md",
                  location.pathname === item.path && "bg-flame-50 text-flame-600"
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <button 
            onClick={() => logout()}
            className="flex w-full items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="mr-3" />
            Keluar
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar Toggle */}
      {/* Mobile sidebar - swipeable navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t overflow-x-auto">
        <div className="flex min-w-full">
          {/* Primary Navigation Items */}
          <div className="grid grid-cols-4 w-full">
            {/* Show Dashboard */}
            <Link
              key={menuItems[0].path}
              to={menuItems[0].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[0].path && "text-flame-600"
              )}
            >
              {menuItems[0].icon}
              <span className="text-xs mt-1">{menuItems[0].label}</span>
            </Link>
            
            {/* Show Inventaris (Inventory) */}
            <Link
              key={menuItems[1].path}
              to={menuItems[1].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[1].path && "text-flame-600"
              )}
            >
              {menuItems[1].icon}
              <span className="text-xs mt-1">{menuItems[1].label}</span>
            </Link>

            {/* Show Pengiriman (Shipping) */}
            <Link
              key={menuItems[2].path}
              to={menuItems[2].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[2].path && "text-flame-600"
              )}
            >
              {menuItems[2].icon}
              <span className="text-xs mt-1">{menuItems[2].label}</span>
            </Link>

            {/* Show Chat */}
            <Link
              key={menuItems[3].path}
              to={menuItems[3].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[3].path && "text-flame-600"
              )}
            >
              {menuItems[3].icon}
              <span className="text-xs mt-1">{menuItems[3].label}</span>
            </Link>
          </div>

          {/* Secondary Navigation Items */}
          <div className="grid grid-cols-4 w-full">
            {/* Show Pengguna (Users) */}
            <Link
              key={menuItems[4].path}
              to={menuItems[4].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[4].path && "text-flame-600"
              )}
            >
              {menuItems[4].icon}
              <span className="text-xs mt-1">{menuItems[4].label}</span>
            </Link>
            
            {/* Show Pesanan (Orders) */}
            <Link
              key={menuItems[5].path}
              to={menuItems[5].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[5].path && "text-flame-600"
              )}
            >
              {menuItems[5].icon}
              <span className="text-xs mt-1">{menuItems[5].label}</span>
            </Link>

            {/* Show Analitik (Analytics) */}
            <Link
              key={menuItems[6].path}
              to={menuItems[6].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[6].path && "text-flame-600"
              )}
            >
              {menuItems[6].icon}
              <span className="text-xs mt-1">{menuItems[6].label}</span>
            </Link>
            
            {/* Show Pengaturan (Settings) */}
            <Link
              key={menuItems[7].path}
              to={menuItems[7].path}
              className={cn(
                "flex flex-col items-center py-2 px-1",
                location.pathname === menuItems[7].path && "text-flame-600"
              )}
            >
              {menuItems[7].icon}
              <span className="text-xs mt-1">{menuItems[7].label}</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 pb-16 md:pb-4">
          {children}
        </main>
      </div>
    </div>
    </NotificationManager>
  );
}
