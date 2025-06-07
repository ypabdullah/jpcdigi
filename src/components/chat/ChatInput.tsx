import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Order {
  id: string;
  total: number;
  date: string;
  status: string;
}

interface ChatInputProps {
  onSendMessage: (content: string, pinnedOrderId?: string | null) => void;
  isLoading?: boolean;
  userOrders?: Order[];
  className?: string;
  disabled?: boolean; // Added disabled prop
}

export function ChatInput({ onSendMessage, isLoading, userOrders, className, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [pinnedOrderId, setPinnedOrderId] = useState<string | null>(null);
  
  const handleSend = () => {
    if (message.trim() && !disabled) { // Check disabled state
      onSendMessage(message.trim(), pinnedOrderId);
      setMessage("");
      setPinnedOrderId(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className={`border-t p-3 bg-background ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {pinnedOrderId && (
        <div className="bg-flame-50 text-flame-600 rounded-md p-2 mb-2 text-xs flex justify-between items-center">
          <span>📌 Pesanan #{pinnedOrderId.substring(0, 8)} disematkan</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPinnedOrderId(null)}
            className="h-6 text-xs"
            disabled={disabled} // Disable this button as well
          >
            Hapus
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        {userOrders && userOrders.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="shrink-0"
                aria-label="Sematkan Pesanan"
                disabled={disabled} // Disable popover trigger
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start" side="top">
              
              <h3 className="font-medium text-sm px-2 py-1">Sematkan Pesanan</h3>
              <ScrollArea className="h-64">
                <div className="space-y-1 mt-1">
                  {userOrders.map(order => (
                    <Button
                      key={order.id}
                      variant="ghost"
                      className="w-full justify-start text-left p-2 h-auto"
                      onClick={() => setPinnedOrderId(order.id)}
                    >
                      <div className="text-xs">
                        <div className="font-medium">Pesanan #{order.id.substring(0, 8)}</div>
                        <div className="text-muted-foreground">
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
        
        <Textarea
          placeholder="Ketik pesan..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[44px] resize-none"
          rows={1}
          disabled={disabled} // Disable textarea
        />
        
        <Button 
          onClick={handleSend} 
          disabled={!message.trim() || isLoading || disabled} // Include disabled state here
          size="icon"
          className="bg-flame-500 hover:bg-flame-600 shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
