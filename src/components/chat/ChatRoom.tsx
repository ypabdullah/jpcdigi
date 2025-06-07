import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Order, ChatSession as AppChatSession, Message as AppMessage } from "@/data/models";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json, ChatDbMessage } from "@/integrations/supabase/custom-types"; // Added ChatDbMessage
import { useSound } from "@/hooks/useSound"; // Added useSound
import { sendChatNotificationToAdmins } from "@/integrations/firebase/chat-notification-service"; // Importar servicio de notificaciones

interface ChatRoomProps {
  chatPartnerId?: string; // For admin: customerId. For customer: adminId (could be generic support ID)
  chatPartnerName?: string;
  isAdmin?: boolean;
}

// Helper to map DB message to ChatMessageProps
const mapDbMessageToChatMessageProps = (dbMessage: AppMessage, currentUserId: string, adminProfileName?: string, customerProfileName?: string): ChatMessageProps => {
  const isSenderAdmin = dbMessage.sender_type === 'admin';
  
  return {
    id: dbMessage.id,
    senderId: dbMessage.sender_id,
    // Determine senderName based on sender_type and context
    senderName: isSenderAdmin 
      ? (adminProfileName || "Dukungan") 
      : (dbMessage.sender_id === currentUserId ? (customerProfileName || "Anda") : (customerProfileName || "Pelanggan")),
    content: dbMessage.content,
    timestamp: dbMessage.created_at,
    isAdmin: isSenderAdmin, // This prop in ChatMessage determines styling based on who sent it
    orderInfo: dbMessage.order_info // Already in the desired format or needs transformation
  };
};


export function ChatRoom({ 
  chatPartnerId, 
  chatPartnerName: initialChatPartnerName = "Dukungan",
  isAdmin = false
}: ChatRoomProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [currentSession, setCurrentSession] = useState<AppChatSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatPartnerName, setChatPartnerName] = useState(initialChatPartnerName);

  const playNewChatMessageSound = useSound("/sounds/new_chat_message_sound.mp3");

  const { data: userOrders } = useQuery({
    queryKey: ['userOrders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, date, status') // Ensure selected fields match Order interface
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user && !isAdmin // Only for customers
  });
  
  useEffect(() => {
    if (!user || !profile) {
      setIsLoadingSession(false);
      return;
    }

    const manageSession = async () => {
      setIsLoadingSession(true);
      try {
        let session: AppChatSession | null = null;
        if (isAdmin) { // Admin logic for fetching/creating session with a specific customer
          if (!chatPartnerId) {
            toast({ title: "Error", description: "Gagal membuat sesi chat admin", variant: "destructive" });
            navigate("/admin/chats"); // Or some other appropriate redirect
            return;
          }
          
          const { data: existingSessions, error: existingSessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('customer_id', chatPartnerId)
            .in('status', ['open', 'active', 'pending']) 
            .order('created_at', { ascending: false })
            .limit(1);

          if (existingSessionError) throw existingSessionError;
          
          if (existingSessions && existingSessions.length > 0) {
            session = existingSessions[0] as AppChatSession;
            // If admin opens a session not yet assigned to them, assign it.
            if (session.admin_id !== user.id && session.status === 'open') {
               const { data: updatedSession, error: updateError } = await supabase
                .from('chat_sessions')
                .update({ admin_id: user.id, status: 'active' })
                .eq('id', session.id)
                .select()
                .maybeSingle(); // MODIFIED: .single() to .maybeSingle()
              if (updateError) throw updateError;
              if (!updatedSession) {
                // This case should ideally not happen if the update was successful on an existing record.
                // Log it or handle as a specific error.
                console.error("Failed to retrieve session after admin assignment update for session ID:", session.id);
                throw new Error("Failed to retrieve session after admin assignment.");
              }
              session = updatedSession as AppChatSession;
            }
          } else {
            // Admin does not create new sessions from this view for now.
            toast({ title: "Tidak ada sesi aktif", description: "Tidak ada sesi chat aktif dengan pelanggan ini. Mereka mungkin perlu memulai chat terlebih dahulu.", variant: "default" });
             setCurrentSession(null); 
             setMessages([]);
             setIsLoadingSession(false);
             return; 
          }
        } else { // Customer logic
          const { data: existingSessions, error: existingSessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('customer_id', user.id)
            .in('status', ['open', 'active', 'pending'])
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(1);

          if (existingSessionError) throw existingSessionError;

          if (existingSessions && existingSessions.length > 0) {
            session = existingSessions[0] as AppChatSession;
          } else {
            const { data: newSessionData, error: newSessionError } = await supabase
              .from('chat_sessions')
              .insert({ customer_id: user.id, status: 'open', topic: 'Pertanyaan Umum' })
              .select()
              .maybeSingle(); // MODIFIED: .single() to .maybeSingle()
            if (newSessionError) throw newSessionError;
            if (!newSessionData) {
              // This is crucial: if insert didn't return data, it means something went wrong or RLS prevents seeing it
              console.error("Failed to create and retrieve new chat session for user:", user.id);
              throw new Error("Failed to create and retrieve chat session.");
            }
            session = newSessionData as AppChatSession;
          }
        }
        setCurrentSession(session);
      } catch (error: any) {
        console.error("Error managing session:", error);
        toast({ title: "Error Chat", description: `Gagal memuat atau membuat sesi chat: ${error.message}`, variant: "destructive" });
        setCurrentSession(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    manageSession();
  }, [user, profile, isAdmin, chatPartnerId, navigate]);

  useEffect(() => {
    if (!currentSession || !user || !profile) { // Added profile check for consistency
      setMessages([]); // Clear messages if no session or user
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender_profile:sender_id(name, email)') // Example: Fetch sender profile if 'profiles' table has 'id' matching 'sender_id'
          .eq('session_id', currentSession.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Determine names for mapping
        // For admin view: chatPartnerName is customer's name. profile.name is admin's name.
        // For customer view: profile.name is customer's name. "Support" is admin's name placeholder.
        const customerProfileName = isAdmin ? chatPartnerName : profile.name;
        const adminProfileName = isAdmin ? profile.name : "Dukungan";


        const formattedMessages = data.map(dbMsgUntyped => {
            const dbMsg = dbMsgUntyped as AppMessage & { sender_profile: { name: string | null, email: string | null} | null };
            // Using mapDbMessageToChatMessageProps, ensuring correct names are passed
            // Current user ID is user.id
            // Admin name: if the current viewer is admin, use their profile name. Otherwise, default to "Support".
            // Customer name: if the current viewer is customer, use their profile name. Otherwise, use chatPartnerName (which is customer name for admin viewer).
             return mapDbMessageToChatMessageProps(
                dbMsg, 
                user.id,
                adminProfileName || "Support", 
                customerProfileName || "Customer"
            );
        });
        setMessages(formattedMessages);
      } catch (error: any) {
        console.error("Error fetching messages:", error);
            toast({ title: "Error", description: "Gagal mengambil detail rekan chat", variant: "destructive" });
      }
    };

    fetchMessages();
  }, [currentSession, user, profile, isAdmin, chatPartnerName]); // Added profile to dependencies


  // Effect for real-time messages and sound
  useEffect(() => {
    if (!currentSession || !user || !profile) return;

    const channel: RealtimeChannel = supabase
      .channel(`messages_session_${currentSession.id}`)
      .on<ChatDbMessage>( // Use ChatDbMessage for payload type consistency
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${currentSession.id}` },
        (payload) => {
          const newMessage = payload.new as AppMessage; // Cast to AppMessage for internal logic
          
          // Avoid processing self-sent messages that were optimistically updated
          if (newMessage.sender_id === user.id && messages.some(m => m.id === newMessage.id || (m.content === newMessage.content && m.senderId === newMessage.sender_id && Math.abs(new Date(m.timestamp).getTime() - new Date(newMessage.created_at).getTime()) < 2000 ))) {
            return;
          }

          const customerProfileName = isAdmin ? chatPartnerName : profile.name;
          const adminProfileName = isAdmin ? profile.name : "Support";

          setMessages(prevMessages => {
            if (prevMessages.some(msg => msg.id === newMessage.id)) {
              return prevMessages; 
            }
            return [...prevMessages, mapDbMessageToChatMessageProps(
                newMessage, 
                user.id,
                adminProfileName || "Support",
                customerProfileName || "Customer"
              )];
          });

          // Play sound if the message is not from the current user
          if (newMessage.sender_id !== user.id) {
            // Specifically:
            // - If customer is viewing (isAdmin=false) and sender is admin.
            // - If admin is viewing (isAdmin=true) and sender is customer.
            if ((!isAdmin && newMessage.sender_type === 'admin') || (isAdmin && newMessage.sender_type === 'customer')) {
              console.log('New message in ChatRoom, playing sound:', newMessage);
              playNewChatMessageSound();
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to messages for session ${currentSession.id}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Subscription error for session ${currentSession.id}:`, err);
          toast({ title: "Realtime Error", description: "Chat connection issue. Please refresh.", variant: "destructive"});
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession, user, profile, isAdmin, chatPartnerName, messages, playNewChatMessageSound]); 

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string, pinnedOrderId: string | null = null) => {
    if (!user || !profile || !currentSession || !content.trim()) return;

    setIsSendingMessage(true);

    try {
      let orderInfoForDb: Json | null = null; 
      if (pinnedOrderId) {
        const order = userOrders?.find(o => o.id === pinnedOrderId);
        if (order) {
          orderInfoForDb = { orderId: order.id, orderTotal: order.total, orderStatus: order.status, orderDate: order.date };
        }
      }
      
      const tempMessageId = uuidv4(); 
      const senderType = isAdmin ? 'admin' : 'customer';
      
      // Determine senderName for optimistic update more accurately
      const optimisticSenderName = profile.name || (isAdmin ? "Admin" : "User");

      const optimisticMessage: ChatMessageProps = {
        id: tempMessageId,
        senderId: user.id,
        senderName: optimisticSenderName,
        content,
        timestamp: new Date().toISOString(),
        isAdmin: isAdmin, 
        orderInfo: orderInfoForDb ? (orderInfoForDb as ChatMessageProps['orderInfo']) : null,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          sender_id: user.id,
          sender_type: senderType,
          content: content.trim(),
          order_info: orderInfoForDb,
        })
        .select()
        .single(); // Using single here as insert should return one row or error

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        throw error;
      }
      
      // Update optimistic message with actual ID and timestamp from DB
      const actualNewMessage = newMessageData as AppMessage;
      setMessages(prev => prev.map(m => m.id === tempMessageId ? { 
          ...m, 
          id: actualNewMessage.id, 
          timestamp: actualNewMessage.created_at 
        } : m ));
        
      // Si el mensaje es de un cliente, enviar notificación FCM a los administradores
      if (senderType === 'customer') {
        sendChatNotificationToAdmins(actualNewMessage)
          .then(success => {
            if (success) {
              console.log('Notificación FCM enviada a los administradores');
            } else {
              console.warn('No se pudo enviar la notificación FCM a los administradores');
            }
          })
          .catch(error => {
            console.error('Error al enviar notificación FCM:', error);
          });
      }

       // Update last_message_at for the session
        await supabase
          .from('chat_sessions')
          .update({ last_message_at: actualNewMessage.created_at, status: 'active' }) // Also update status to active
          .eq('id', currentSession.id);
        
        // Optionally, refresh session data if needed locally
        setCurrentSession(prev => prev ? ({...prev, last_message_at: actualNewMessage.created_at, status: 'active'}) : null);


    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const chatHeaderTitle = isAdmin 
    ? (chatPartnerName || 'Customer') 
    : (profile?.role === 'admin' ? (initialChatPartnerName || "Support") : "Customer Support");


  if (!user || !profile) { 
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-flame-500" />
        <p className="ml-2">Memuat pengguna...</p>
      </div>
    );
  }

  if (isLoadingSession) {
     return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-flame-500" />
        <p className="ml-2">Memuat sesi chat...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Customer Support Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white border-b p-3 flex items-center shadow-sm z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate(isAdmin ? '/admin/chats' : '/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-charcoal-100 flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-charcoal-500" />
          </div>
          <div>
            <h3 className="font-medium">
              {chatHeaderTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAdmin && currentSession ? `ID Sesi: ${currentSession.id.substring(0,8)}` : 'Kami biasanya merespon dalam 1 jam'}
              {!isAdmin && currentSession && currentSession.status !== 'active' && currentSession.status !== 'open' && ' (Menunggu dukungan...)'}
              {!isAdmin && currentSession && (currentSession.status === 'open' || currentSession.status === 'pending') && ' (Menghubungkan ke dukungan...)'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Adding extra space at the top to prevent messages from being hidden behind the header */}
      <div className="h-16 pt-3"></div>
      
      <ScrollArea 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-charcoal-50"
      >
        {!currentSession && !isLoadingSession && !isAdmin && (
           <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <p className="text-muted-foreground">Tidak dapat memulai atau memuat sesi chat. Silakan coba muat ulang halaman.</p>
           </div>
        )}
        {!currentSession && !isLoadingSession && isAdmin && (
           <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <p className="text-muted-foreground">Tidak ada sesi chat aktif dengan pelanggan ini. Mereka mungkin perlu memulai chat terlebih dahulu.</p>
           </div>
        )}
        {currentSession && messages.length === 0 && !isLoadingSession && ( // Added !isLoadingSession
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            
            <div className="mb-4 text-charcoal-400">
              <div className="h-16 w-16 rounded-full bg-flame-100 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-flame-500" />
              </div>
              <h3 className="font-medium text-charcoal-600 mb-1">
                {isAdmin ? `Chat dengan ${chatPartnerName}` : 'Dukungan Pelanggan'}
              </h3>
              <p className="text-sm text-charcoal-500">
                {isAdmin 
                  ? "Kirim pesan untuk mulai chat dengan pelanggan ini."
                  : "Kirim pesan untuk mendapatkan bantuan dari tim dukungan kami."}
              </p>
            </div>
          </div>
        )}
        {currentSession && messages.map(message => (
            <ChatMessage
              key={message.id}
              id={message.id}
              senderId={message.senderId}
              senderName={message.senderName}
              content={message.content}
              timestamp={message.timestamp}
              isAdmin={message.isAdmin} 
              orderInfo={message.orderInfo}
            />
          ))
        }
      </ScrollArea>
      
      {/* Chat Input - Fixed at bottom above navigation */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-background z-20 border-t">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isSendingMessage || isLoadingSession}
          userOrders={!isAdmin ? userOrders : undefined}
          disabled={!currentSession || (isAdmin && !chatPartnerId) || (!isLoadingSession && !currentSession && !isAdmin) }
        />
      </div>
      {/* Adding extra space at the bottom to prevent messages from being hidden behind the input */}
      <div className="h-24"></div>
    </div>
  );
}
