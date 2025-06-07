
import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AdminChatPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [customerName, setCustomerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (!customerId) {
        navigate("/admin/chats");
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch customer profile
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', customerId)
          .single();
          
        if (error) throw error;
        
        setCustomerName(data.name || data.email || 'Pelanggan');
      } catch (error) {
        console.error("Error fetching customer info:", error);
        navigate("/admin/chats");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerInfo();
  }, [customerId, navigate]);
  
  // Check if user is admin
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">Akses tidak diizinkan</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (isLoading || !customerId) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-80">
          <Loader2 className="animate-spin h-8 w-8 text-flame-500" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="h-[calc(100vh-64px)]">
        <ChatRoom 
          chatPartnerId={customerId} 
          chatPartnerName={customerName}
          isAdmin={true}
        />
      </div>
    </AdminLayout>
  );
}
