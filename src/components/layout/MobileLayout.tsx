import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, User, MessageSquare, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  
  // Check if current path is a PPOB route
  const isPPOBRoute = location.pathname.startsWith('/ppob');
  
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background">
      {/* Main Content */}
      <main className={cn("flex-1 overflow-y-auto", {
        "pb-16 bottom-tab-height": !isPPOBRoute
      })}>
        {children}
      </main>
      
      {/* Admin Access Link */}
      {location.pathname === "/" && (
        <div className="text-center mb-2">
          <Link 
            to="/admin-login" 
            className="text-xs text-muted-foreground hover:text-flame-500"
          >
            Akses Admin
          </Link>
        </div>
      )}
      
      {/* Bottom Navigation - Hide on PPOB routes */}
      {!isPPOBRoute && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-background border-t">
          <div className="flex justify-around items-center h-16">
          <TabItem 
            to="/" 
            icon={<Home className="h-6 w-6" />} 
            label="Beranda" 
            isActive={location.pathname === "/"} 
          />
          <TabItem 
            to="/chat" 
            icon={<MessageSquare className="h-6 w-6" />} 
            label="Chat" 
            isActive={location.pathname === "/chat"} 
          />
          <TabItem 
            to="/cart" 
            icon={<ShoppingCart className="h-6 w-6" />} 
            label="Keranjang" 
            isActive={location.pathname === "/cart"} 
          />
          <TabItem 
            to="/orders" 
            icon={<Package className="h-6 w-6" />} 
            label="Pesanan" 
            isActive={location.pathname.includes("/order") || location.pathname === "/orders"} 
          />
          <TabItem 
            to="/profile" 
            icon={<User className="h-6 w-6" />} 
            label="Profil" 
            isActive={location.pathname === "/profile"} 
          />
        </div>
      </nav>
      )}
    </div>
  );
}

interface TabItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function TabItem({ to, icon, label, isActive }: TabItemProps) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center w-full">
      <div className={cn(
        "flex flex-col items-center justify-center",
        isActive ? "text-flame-500" : "text-charcoal-400"
      )}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </div>
    </Link>
  );
}
