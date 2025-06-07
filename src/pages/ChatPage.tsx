
import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ChatPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <MobileLayout>
      <ChatRoom />
    </MobileLayout>
  );
}
