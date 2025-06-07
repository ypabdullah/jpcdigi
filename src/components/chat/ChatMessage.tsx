
import React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";

export interface ChatMessageProps {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
  orderInfo?: {
    orderId: string;
    orderTotal: number;
  } | null;
}

export function ChatMessage({
  content,
  timestamp,
  isAdmin,
  senderName,
  orderInfo
}: ChatMessageProps) {
  const { profile } = useAuth();
  const isCurrentUser = profile?.role === 'admin' ? isAdmin : !isAdmin;
  
  return (
    <div className={cn(
      "flex mb-4",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[75%] rounded-lg px-4 py-2 shadow-sm",
        isCurrentUser 
          ? "bg-flame-500 text-white rounded-br-none" 
          : "bg-white text-charcoal-800 border rounded-bl-none"
      )}>
        <div className="flex justify-between items-center mb-1">
          <span className={cn(
            "text-xs font-medium",
            isCurrentUser ? "text-white/80" : "text-charcoal-500"
          )}>
            {senderName}
          </span>
          <span className={cn(
            "text-xs ml-2",
            isCurrentUser ? "text-white/70" : "text-charcoal-400"
          )}>
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: id })}
          </span>
        </div>
        
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        
        {orderInfo && (
          <div className="mt-2 pt-2 border-t border-white/20 text-xs">
            <div className={cn(
              "rounded-md p-2",
              isCurrentUser ? "bg-white/10" : "bg-flame-50"
            )}>
              <div className={cn(
                "font-medium",
                isCurrentUser ? "text-white" : "text-flame-600"
              )}>
                📌 Pesanan Disematkan: #{orderInfo.orderId.substring(0, 8)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
