import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Icons } from "@/components/Icons";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/admin", icon: <Icons.home className="h-5 w-5" /> },
    { name: "Inventaris", href: "/admin/inventory", icon: <Icons.package className="h-5 w-5" /> },
    { name: "Inventaris Batubara", href: "/admin/coal-inventory", icon: <Icons.layers className="h-5 w-5" /> },
    { name: "Pengiriman", href: "/admin/shipping", icon: <Icons.truck className="h-5 w-5" /> },
    { name: "Pengguna", href: "/admin/users", icon: <Icons.users className="h-5 w-5" /> },
    { name: "Pesanan", href: "/admin/orders", icon: <Icons.shoppingCart className="h-5 w-5" /> },
    { name: "PPOB", href: "/admin/ppob", icon: <Icons.creditCard className="h-5 w-5" /> },
    { name: "Voucher", href: "/admin/vouchers", icon: <Icons.ticket className="h-5 w-5" /> },
    { name: "Broadcast", href: "/admin/broadcast", icon: <Icons.megaphone className="h-5 w-5" /> },
    { name: "Analitik", href: "/admin/analytics", icon: <Icons.barChart className="h-5 w-5" /> },
    { name: "Pengaturan", href: "/admin/settings", icon: <Icons.settings className="h-5 w-5" /> },
    { name: "Chat", href: "/admin/chats", icon: <Icons.messageSquare className="h-5 w-5" /> },
  ];

  const isActive = (href: string) => {
    if (href === "/admin" && location.pathname === "/admin") {
      return true;
    }
    return location.pathname.startsWith(href) && href !== "/admin";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto border-r bg-white">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link to="/admin" className="flex items-center">
              <img className="h-8 w-auto" src="/logo.svg" alt="JPC Digi Logo" />
              <span className="ml-2 text-xl font-bold">JPC Digi Admin</span>
            </Link>
          </div>
          <div className="mt-6 px-3 flex-grow flex flex-col">
            <nav className="flex-1 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-3 mt-auto border-t">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src="/avatars/admin.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">Admin JPC</p>
                <p className="text-xs text-muted-foreground">admin@jpcdigi.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
              <Icons.menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full pt-5">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link to="/admin" className="flex items-center" onClick={() => setIsOpen(false)}>
                  <img className="h-8 w-auto" src="/logo.svg" alt="JPC Digi Logo" />
                  <span className="ml-2 text-xl font-bold">JPC Digi Admin</span>
                </Link>
              </div>
              <div className="mt-6 px-3 flex-grow flex flex-col">
                <nav className="flex-1 space-y-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        isActive(item.href)
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-3 mt-auto border-t">
                <div className="flex items-center">
                  <Avatar>
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Admin JPC</p>
                    <p className="text-xs text-muted-foreground">admin@jpcdigi.com</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-4 md:py-6 flex items-center justify-between">
              <div className="md:hidden">
                <h1 className="text-lg font-medium">JPC Digi Admin</h1>
              </div>
              <div className="flex items-center ml-auto">
                <Button variant="outline" size="sm" className="mr-2">
                  <Icons.bell className="h-4 w-4 mr-2" />
                  <span className="sr-only md:not-sr-only md:inline-block">Notifikasi</span>
                </Button>
                <Button variant="destructive" size="sm">
                  <Icons.logOut className="h-4 w-4 mr-2" />
                  <span className="sr-only md:not-sr-only md:inline-block">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
