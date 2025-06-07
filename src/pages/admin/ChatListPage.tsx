
import React, { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, MessageSquare, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from "@/hooks/use-toast";

interface ChatUser {
  id: string;
  name: string;
  lastMessage?: string;
  lastTimestamp?: string;
  unread?: boolean; // diubah menjadi boolean untuk menandakan status dibaca
  messageId?: string; // ID pesan untuk menandai sudah dibaca
  isFromCustomer?: boolean;
  senderName?: string;
  isLatestCustomerMessage?: boolean; // flag untuk menandai pesan terbaru dari pelanggan
}

interface MessageWithProfile {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read: boolean; // status dibaca atau belum
  profiles?: {
    name: string;
  };
}

export function ChatListPage() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ChatUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const { user } = useAuth();
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  
  // Fungsi untuk memperbarui daftar chat secara realtime saat ada pesan baru
  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    // Subscribe ke tabel messages untuk mendengarkan pesan baru
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('Pesan baru diterima:', payload);
        
        // Periksa apakah pesan ini dari pelanggan (bukan dari admin)
        const isFromCustomer = payload.new && payload.new.sender_id !== user?.id;
        
        if (isFromCustomer) {
          // Pastikan pesan ini belum dibaca (read=false atau kolom read belum ada)
          if (payload.new.read === false || payload.new.read === null || payload.new.read === undefined) {
            // Increment pesan baru dan refresh daftar chat
            setNewMessageCount(prev => prev + 1);
            
            // Tampilkan notifikasi toast
            toast({
              title: "Pesan Baru Diterima",
              description: `Ada pesan baru dari pelanggan: ${payload.new.content.substring(0, 30)}${payload.new.content.length > 30 ? '...' : ''}`,
              variant: "default"
            });
            
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Error playing notification sound:', e));
          }
        }
        
        // Refresh daftar chat
        fetchChatUsers();
      })
      .subscribe();
      
    subscriptionRef.current = subscription;
    
    return () => {
      subscription.unsubscribe();
    };
  };
  
  // Effect untuk setup subscription realtime
  useEffect(() => {
    if (user) {
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user]);
  
  // Effect untuk fetch users
  useEffect(() => {
    if (user) {
      fetchChatUsers();
    }
  }, [user]);
  const fetchChatUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all customers from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer');
      
      if (profilesError) throw profilesError;
      
      // Prepare to store all users with their latest messages
      const chatUsers: ChatUser[] = [];
      
      // Process each user
      for (const profile of profilesData || []) {
        // Ambil data customer secara detail
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (customerError) {
          console.error("Error fetching customer details:", customerError);
        }
          
        // Get ALL messages from database untuk customer ini
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            profiles:sender_id(name, email)
          `)
          .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
          .order('created_at', { ascending: false });
          
        // Hitung berapa pesan dari pelanggan yang belum dibaca
        const unreadCount = messagesData ? 
          messagesData.filter(msg => 
            msg.sender_id === profile.id && 
            msg.read === false
          ).length : 0;
          
        if (unreadCount > 0) {
          console.log(`${unreadCount} pesan belum dibaca dari pelanggan:`, profile.name);
        }
        
        if (messagesError) {
          console.error("Error fetching messages for user:", messagesError);
        }
        
        // Also check localStorage for any unsaved messages
        const storageKey = `admin_chat_${profile.id}`;
        const storedMessages = localStorage.getItem(storageKey);
        
        let lastMessage = "", lastTimestamp = "";
        let localLastMsg = null, dbLastMsg = null;
        
        // Get latest message from localStorage if available
        if (storedMessages) {
          try {
            const messages = JSON.parse(storedMessages);
            if (messages.length > 0) {
              localLastMsg = messages[messages.length - 1];
            }
          } catch (e) {
            console.error("Error parsing stored messages", e);
          }
        }
        
        // Get messages from database and process them
        if (messagesData && messagesData.length > 0) {
          // Type casting for the first message (most recent)
          const message = messagesData[0] as unknown as MessageWithProfile;
          const senderName = message.profiles?.name || profile.name;
          
          // Set the latest message info
          dbLastMsg = {
            content: message.content,
            timestamp: message.created_at,
            sender_id: message.sender_id,
            senderName: senderName
          };
          
          // Log all messages for this customer
          console.log(`${messagesData.length} pesan ditemukan untuk pelanggan:`, profile.name);
          messagesData.forEach((msg, index) => {
            console.log(`Pesan #${index + 1}:`, {
              content: msg.content,
              timestamp: new Date(msg.created_at).toLocaleString('id-ID'),
              isFromCustomer: msg.sender_id === profile.id
            });
          });
        }
        
        // Determine which message is more recent and if it's from the customer
        let isFromCustomer = false;
        
        if (localLastMsg && dbLastMsg) {
          // Compare timestamps to choose the most recent one
          const localTime = new Date(localLastMsg.timestamp).getTime();
          const dbTime = new Date(dbLastMsg.timestamp).getTime();
          
          if (localTime > dbTime) {
            lastMessage = localLastMsg.content;
            lastTimestamp = localLastMsg.timestamp;
            // Check if this local message is from customer (not from admin)
            isFromCustomer = localLastMsg.sender !== 'admin';
          } else {
            lastMessage = dbLastMsg.content;
            lastTimestamp = dbLastMsg.timestamp;
            // Check if this DB message is from customer
            isFromCustomer = dbLastMsg.sender_id === profile.id;
            
            // Sender name will be added when creating the chatUser object
          }
        } else if (localLastMsg) {
          lastMessage = localLastMsg.content;
          lastTimestamp = localLastMsg.timestamp;
          // Check if this local message is from customer (not from admin)
          isFromCustomer = localLastMsg.sender !== 'admin';
        } else if (dbLastMsg) {
          lastMessage = dbLastMsg.content;
          lastTimestamp = dbLastMsg.timestamp;
          // Check if this DB message is from customer
          isFromCustomer = dbLastMsg.sender_id === profile.id;
        }
        
        // Tentukan pesan untuk ditampilkan berdasarkan data dari database
        let senderName;
        let messageContent = "";
        let messageId = "";
        let isUnread = false;
        let customerMessage = null;
        
        // Cek apakah ada pesan dari database
        if (messagesData && messagesData.length > 0) {
          // Log semua pesan yang ditemukan untuk pelanggan ini
          console.log(`Semua pesan untuk ${profile.name}:`, messagesData.length, 'pesan ditemukan');
          
          // Cari pesan yang belum dibaca dari pelanggan dulu (prioritas)
          // Pesan baru selalu belum dibaca, jika read=false ATAU kolom read belum ada (null/undefined)
          const unreadCustomerMessages = messagesData.filter(
            msg => msg.sender_id === profile.id && (msg.read === false || msg.read === null || msg.read === undefined)
          );
          
          // Log untuk debugging
          if (unreadCustomerMessages.length > 0) {
            console.log('Pesan belum dibaca ditemukan:', unreadCustomerMessages.length, 'pesan');
            console.log('Sample pesan belum dibaca:', unreadCustomerMessages[0]);
          }
          
          // Kemudian cari semua pesan dari pelanggan
          const customerMessages = messagesData.filter(msg => msg.sender_id === profile.id);
          
          if (customerMessages.length > 0) {
            console.log(`Pesan dari pelanggan ${profile.name}:`, customerMessages.length, 'pesan');
          }
          
          if (unreadCustomerMessages.length > 0) {
            // Gunakan pesan dari pelanggan yang belum dibaca (prioritas tertinggi)
            customerMessage = unreadCustomerMessages[0] as unknown as MessageWithProfile;
            senderName = customerMessage.profiles?.name || customerData?.name || profile.name || profile.email || 'Pelanggan';
            messageContent = customerMessage.content;
            messageId = customerMessage.id;
            isUnread = true; // Tandai sebagai belum dibaca
            isFromCustomer = true;
          } else if (customerMessages.length > 0) {
            // Gunakan pesan terbaru dari pelanggan (yang mungkin sudah dibaca)
            customerMessage = customerMessages[0] as unknown as MessageWithProfile;
            senderName = customerMessage.profiles?.name || customerData?.name || profile.name || profile.email || 'Pelanggan';
            messageContent = customerMessage.content;
            messageId = customerMessage.id;
            isUnread = false; // Sudah dibaca
            isFromCustomer = true;
          } else {
            // Jika tidak ada pesan dari pelanggan, gunakan pesan terakhir (dari admin)
            const lastMsg = messagesData[0] as unknown as MessageWithProfile;
            senderName = 'Admin';
            messageContent = lastMsg.content;
            messageId = lastMsg.id;
            isUnread = false; // Pesan dari admin tidak perlu tanda "belum dibaca"
            isFromCustomer = false;
          }
        } else {
          // Tidak ada pesan di database - coba dapatkan data dari customer atau pesan alternatif
          if (customerData) {
            console.log('Detail customer ditemukan:', customerData);
            // Jika ada data customer, gunakan data tersebut
            senderName = customerData.name || profile.name || profile.email || 'Pelanggan';
            
            // Coba ambil pesan terakhir dari pelanggan ini jika ada
            const { data: latestMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('sender_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (latestMsg && latestMsg.length > 0) {
              // Gunakan pesan terbaru jika ditemukan
              messageContent = latestMsg[0].content;
              console.log('Pesan terbaru ditemukan:', messageContent);
            } else {
              // Jika tidak ada pesan sama sekali, gunakan informasi dari profil
              messageContent = customerData.last_seen 
                ? `Terakhir aktif: ${new Date(customerData.last_seen).toLocaleString('id-ID')}` 
                : "Belum ada riwayat pesan";
            }
          } else {
            // Tidak ada data customer sama sekali
            senderName = profile.name || profile.email || 'Pelanggan';
            messageContent = "Pelanggan baru mendaftar";
          }
          
          isFromCustomer = true; // Perlakukan ini sebagai 'pesan pelanggan' untuk styling
          isUnread = false; // Tidak ada pesan berarti tidak ada yang belum dibaca
        }
        
        chatUsers.push({
          id: profile.id,
          name: profile.name || profile.email || 'Pelanggan Tidak Dikenal',
          lastMessage: messageContent || lastMessage, // Prioritaskan pesan dari pelanggan
          lastTimestamp,
          unread: isUnread, // Status dibaca dari database
          messageId, // ID pesan untuk menandai sudah dibaca nanti
          isFromCustomer,
          senderName
        });
      }
      
      // Cari timestamp terbaru di antara semua pesan pelanggan
      let latestCustomerTimestamp = 0;
      
      // Pertama, temukan timestamp pesan terbaru dari semua pelanggan
      for (const chatUser of chatUsers) {
        if (chatUser.lastTimestamp && chatUser.isFromCustomer) {
          const timestamp = new Date(chatUser.lastTimestamp).getTime();
          latestCustomerTimestamp = Math.max(latestCustomerTimestamp, timestamp);
        }
      }
      
      console.log('Timestamp pesan terbaru dari pelanggan:', new Date(latestCustomerTimestamp).toLocaleString('id-ID'));
      
      // Tandai pelanggan yang pesan terbarunya sama dengan timestamp terbaru yang ditemukan
      for (const chatUser of chatUsers) {
        if (chatUser.lastTimestamp && chatUser.isFromCustomer) {
          const timestamp = new Date(chatUser.lastTimestamp).getTime();
          // Jika pesan ini adalah pesan terbaru berdasarkan waktu
          if (timestamp === latestCustomerTimestamp) {
            chatUser.isLatestCustomerMessage = true;
            console.log('Pelanggan dengan pesan terbaru:', chatUser.name, 'pada', new Date(timestamp).toLocaleString('id-ID'));
          }
        }
      }
      
      // PRIORITAS PENGURUTAN BARU:
      // 1. Pelanggan dengan pesan PALING BARU berdasarkan waktu akan muncul paling atas
      // 2. Setelah itu, pesan diurutkan berdasarkan timestamp secara umum (dari terbaru ke terlama)
      // 3. Untuk pesan dengan timestamp yang sama, prioritaskan pesan dari pelanggan daripada admin
      // 4. Prioritaskan pesan yang belum dibaca
      chatUsers.sort((a, b) => {
        // Pesan terbaru dari pelanggan selalu di atas (yang ditandai sebelumnya)
        if (a.isLatestCustomerMessage && !b.isLatestCustomerMessage) return -1;
        if (!a.isLatestCustomerMessage && b.isLatestCustomerMessage) return 1;
        
        // Jika keduanya pesan terbaru atau keduanya bukan, urutkan berdasarkan timestamp
        if (!a.lastTimestamp && !b.lastTimestamp) {
          // Jika keduanya tidak punya timestamp, prioritaskan pesan dari pelanggan
          if (a.isFromCustomer && !b.isFromCustomer) return -1;
          if (!a.isFromCustomer && b.isFromCustomer) return 1;
          return 0;
        }
        
        // Jika salah satu tidak punya timestamp
        if (!a.lastTimestamp) return 1; // a ke bawah
        if (!b.lastTimestamp) return -1; // b ke bawah
        
        // Bandingkan timestamp untuk menemukan yang paling baru
        const timeA = new Date(a.lastTimestamp).getTime();
        const timeB = new Date(b.lastTimestamp).getTime();
        
        if (timeA !== timeB) {
          return timeB - timeA; // Pesan terbaru di atas (descending order)
        }
        
        // Jika timestamp sama:
        // Prioritaskan pesan dari pelanggan dibanding dari admin
        if (a.isFromCustomer && !b.isFromCustomer) return -1;
        if (!a.isFromCustomer && b.isFromCustomer) return 1;
        
        // Prioritaskan pesan yang belum dibaca
        if (a.unread && !b.unread) return -1;
        if (!a.unread && b.unread) return 1;
        
        // Jika masih sama, urutkan berdasarkan nama
        return a.name.localeCompare(b.name);
      });
      
      console.log('Daftar chat yang sudah diurutkan:', 
        chatUsers.map(u => ({
          name: u.name,
          timestamp: u.lastTimestamp ? new Date(u.lastTimestamp).toLocaleString('id-ID') : 'tidak ada',
          isFromCustomer: u.isFromCustomer,
          unread: u.unread
        }))
      );
      
      setUsers(chatUsers);
    } catch (error) {
      console.error("Error fetching chat users:", error);
    } finally {
      setIsLoading(false);
    }
  };
    
  // Fungsi untuk menandai pesan sebagai sudah dibaca
  const markAsRead = async (chatUser: ChatUser) => {
    // Jika pesan belum dibaca dan ada ID pesan
    if (chatUser.unread && chatUser.messageId) {
      console.log('Menandai pesan sebagai sudah dibaca:', chatUser.messageId);
      
      try {
        // Update database
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', chatUser.messageId);
        
        if (error) {
          throw error;
        }
        
        // Update state lokal
        setNewMessageCount(prev => Math.max(0, prev - 1));
        
        // Refresh daftar chat
        fetchChatUsers();
        
        console.log('Pesan berhasil ditandai sebagai dibaca');
      } catch (error) {
        console.error('Error menandai pesan sebagai dibaca:', error);
        
        // Jika terjadi error karena kolom 'read' belum ada, kita perlu menambahkannya
        // Ini temporary fallback untuk database yang belum diupdate schemanya
        console.log('Mencoba fallback untuk database lama...');
        toast({
          title: "Perhatian",
          description: "Perlu update skema database untuk fitur 'sudah dibaca'",
          variant: "default"
        });
      }
    }
  };
  
  // Effect untuk filter users berdasarkan search term
  useEffect(() => {
    const filtered = searchTerm
      ? users.filter(chatUser => 
          chatUser.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : users;
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, newMessageCount]);
    
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Satuan waktu dalam milidetik
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    
    // Format waktu relatif dalam bahasa Indonesia
    if (diff < minute) {
      return 'Baru saja';
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes} menit yang lalu`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours} jam yang lalu`;
    } else if (diff < week) {
      const days = Math.floor(diff / day);
      return `${days} hari yang lalu`;
    } else if (diff < month) {
      const weeks = Math.floor(diff / week);
      return `${weeks} minggu yang lalu`;
    } else {
      // Untuk pesan yang lebih lama, gunakan format tanggal
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };
  
  return (
    <AdminLayout>
      <div className="p-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Obrolan Pelanggan</CardTitle>
                  {newMessageCount > 0 && (
                    <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center animate-pulse">
                      <Bell className="h-3 w-3 mr-1" />
                      {newMessageCount} baru
                    </div>
                  )}
                </div>
                <CardDescription>
                  Kelola percakapan dukungan pelanggan secara realtime
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari pelanggan..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              {newMessageCount > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={async () => {
                    // Update semua pesan yang belum dibaca
                    try {
                      // Ambil semua pesan yang belum dibaca
                      const { data: unreadMessages, error: fetchError } = await supabase
                        .from('messages')
                        .select('id')
                        .eq('receiver_id', user?.id)
                        .is('read', null);
                        
                      if (fetchError) throw fetchError;
                      
                      // Update pesan dengan read=false
                      const { error: updateError1 } = await supabase
                        .from('messages')
                        .update({ read: true })
                        .eq('read', false)
                        .eq('receiver_id', user?.id);
                        
                      if (updateError1) throw updateError1;
                      
                      // Update pesan dengan read=null (belum ada kolom read)
                      if (unreadMessages && unreadMessages.length > 0) {
                        const { error: updateError2 } = await supabase
                          .from('messages')
                          .update({ read: true })
                          .is('read', null)
                          .eq('receiver_id', user?.id);
                          
                        if (updateError2) throw updateError2;
                      }
                      
                      // Semua berhasil diupdate
                      setNewMessageCount(0);
                      fetchChatUsers();
                      toast({
                        title: "Berhasil",
                        description: "Semua pesan telah ditandai sebagai dibaca",
                        variant: "default"
                      });
                    } catch (error) {
                      console.error('Error menandai semua pesan sebagai dibaca:', error);
                      toast({
                        title: "Error",
                        description: "Gagal menandai pesan sebagai dibaca",
                        variant: "destructive"
                      });
                    }
                  }} 
                  className="w-full text-center text-sm text-flame-500 hover:bg-orange-50 mb-2"
                >
                  Tandai semua sebagai telah dibaca
                </Button>
              )}
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">
                  Memuat obrolan pelanggan...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {searchTerm ? "Tidak ada pelanggan yang sesuai dengan pencarian" : "Belum ada obrolan pelanggan"}
                </p>
              ) : (
                filteredUsers.map(chatUser => (
                  <Link
                    key={chatUser.id}
                    to={`/admin/chat/${chatUser.id}`}
                    className="block"
                    onClick={() => markAsRead(chatUser)}
                  >
                    <Button 
                      variant={chatUser.isFromCustomer ? "default" : "ghost"}
                      className={`w-full justify-start px-3 py-6 h-auto ${chatUser.isFromCustomer ? 'bg-orange-100 border-2 border-orange-400 shadow-md hover:bg-orange-200' : 'hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center w-full">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${chatUser.isFromCustomer ? 'bg-orange-400' : 'bg-charcoal-100'}`}>
                          <User className={`h-5 w-5 ${chatUser.isFromCustomer ? 'text-white' : 'text-charcoal-500'}`} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-center">
                            <span className={`truncate ${chatUser.isFromCustomer ? 'font-bold text-orange-600' : 'font-medium'}`}>{chatUser.name}</span>
                            {chatUser.lastTimestamp && (
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                {formatTimestamp(chatUser.lastTimestamp)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {chatUser.unread && (
                                <div className="flex items-center bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full mr-2 animate-pulse shadow-md">
                                  <span>BARU</span>
                                </div>
                              )}
                              <p className={`text-sm truncate ${chatUser.isFromCustomer ? 'text-orange-700 font-semibold' : 'text-muted-foreground'}`}>
                                <>
                                  <span className="font-semibold">{chatUser.senderName || (chatUser.isFromCustomer ? chatUser.name : 'Admin')}</span>: {chatUser.lastMessage || "Memuat data pesan..."}
                                </>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Button>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
