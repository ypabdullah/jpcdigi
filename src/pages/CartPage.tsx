
import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrashIcon, Minus, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";

const CartPage = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast({
      title: "Item dihapus",
      description: "Item telah dihapus dari keranjang Anda."
    });
  };
  
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      toast({
        title: "Item dihapus",
        description: "Item telah dihapus dari keranjang Anda."
      });
    } else {
      updateQuantity(id, newQuantity);
    }
  };
  
  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Silakan tambahkan item ke keranjang Anda sebelum checkout",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk melanjutkan ke checkout",
        variant: "destructive"
      });
      return;
    }
    
    navigate("/checkout");
  };

  return (
    <MobileLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Keranjang Belanja</h1>
        
        {items.length > 0 ? (
          <div>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="h-20 w-20 bg-charcoal-100 rounded flex-shrink-0">
                        <img
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground">{item.type}</span>
                            <Link to={`/product/${item.id}`}>
                              <h3 className="font-medium text-sm line-clamp-1 mb-1">{item.name}</h3>
                            </Link>
                            <span className="font-bold">{formatRupiah(item.price)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none p-0"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-3 py-1 text-sm border-l border-r">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none p-0"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold">{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <button
              onClick={() => {
                clearCart();
                toast({
                  title: "Keranjang dikosongkan",
                  description: "Semua item telah dihapus dari keranjang Anda."
                });
              }}
              className="text-sm text-muted-foreground hover:text-destructive mb-4 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Kosongkan keranjang
            </button>
            
            <div className="bg-secondary rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span className="font-medium">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Pengiriman</span>
                <span className="font-medium">{formatRupiah(5000)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold">{formatRupiah(total + 5000)}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleCheckout} 
              className="w-full bg-flame-500 hover:bg-flame-600"
            >
              {user ? "Lanjut ke Pembayaran" : "Login untuk Checkout"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-charcoal-400 mb-4">
              <ShoppingCart size={64} className="mx-auto" />
            </div>
            <h2 className="text-xl font-medium mb-2">Keranjang Anda kosong</h2>
            <p className="text-muted-foreground mb-6">
              Sepertinya Anda belum menambahkan produk arang ke keranjang.
            </p>
            <Link to="/search">
              <Button className="bg-flame-500 hover:bg-flame-600">
                Jelajahi Produk
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

// Cart icon component
const ShoppingCart = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

export default CartPage;
