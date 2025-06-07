
import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingCart, Star, Minus, Plus, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/data/models";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addItem } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setProduct(data as unknown as Product);
          document.title = `${data.name} - Toko Arang`;
        } else {
          setError("Produk tidak ditemukan");
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
    
    // Reset state when id changes
    return () => {
      setProduct(null);
      setQuantity(1);
      setActiveImageIndex(0);
    };
  }, [id]);
  
  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.discount 
        ? product.price * (1 - product.discount / 100) 
        : product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg',
      type: product.type,
      quantity
    });
    
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${quantity} ${quantity === 1 ? 'produk' : 'produk'} ditambahkan ke keranjang Anda`
    });
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };
  
  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  if (loading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <Loader2 className="h-8 w-8 animate-spin text-flame-500 mb-2" />
          <p className="text-muted-foreground">Memuat detail produk...</p>
        </div>
      </MobileLayout>
    );
  }
  
  if (error || !product) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              className="p-0 mr-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Produk Tidak Ditemukan</h1>
          </div>
          
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">{error || "Produk yang diminta tidak dapat ditemukan."}</p>
            <Link to="/search">
              <Button className="bg-flame-500 hover:bg-flame-600">
                Jelajahi Produk
              </Button>
            </Link>
          </div>
        </div>
      </MobileLayout>
    );
  }
  
  const actualPrice = product.discount 
    ? product.price * (1 - product.discount / 100) 
    : product.price;
  
  return (
    <MobileLayout>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background p-4 flex items-center shadow-sm">
          <Button 
            variant="ghost" 
            className="p-0 mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium line-clamp-1">{product.name}</h1>
        </div>
        
        {/* Product Images */}
        <div className="bg-charcoal-50 h-72 relative">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[activeImageIndex]}
                alt={product.name}
                className="h-full w-full object-contain"
              />
              
              {/* Image thumbnails if more than 1 image */}
              {product.images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        activeImageIndex === index ? "bg-flame-500" : "bg-white bg-opacity-50"
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-charcoal-100">
              <p className="text-muted-foreground">Gambar tidak tersedia</p>
            </div>
          )}
          
          {/* Discount badge */}
          {product.discount && product.discount > 0 && (
            <div className="absolute top-2 right-2 bg-flame-500 text-white text-sm px-3 py-1 rounded-full">
              {product.discount}% DISKON
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm text-muted-foreground">{product.type}</span>
                <h2 className="text-xl font-bold">{product.name}</h2>
              </div>
              <div className="text-right">
                {product.discount && product.discount > 0 ? (
                  <>
                    <div className="font-bold text-lg text-flame-500">{formatRupiah(actualPrice)}</div>
                    <div className="text-sm text-muted-foreground line-through">{formatRupiah(product.price)}</div>
                  </>
                ) : (
                  <div className="font-bold text-lg">{formatRupiah(product.price)}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center mt-1">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={`${
                      star <= (product.rating || 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating || 0} ({product.review_count || 0} ulasan)
              </span>
            </div>
            
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 rounded text-xs ${
                product.in_stock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {product.in_stock ? "Tersedia" : "Habis"}
              </span>
              {product.origin && (
                <span className="inline-block ml-2 text-xs text-muted-foreground">
                  Asal: {product.origin}
                </span>
              )}
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Product Tabs */}
          <Tabs defaultValue="description" className="mt-4">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="description">Deskripsi</TabsTrigger>
              <TabsTrigger value="specifications">Spesifikasi</TabsTrigger>
              <TabsTrigger value="reviews">Ulasan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-4">
              <p className="text-sm">{product.description || "Tidak ada deskripsi tersedia."}</p>
              {product.seller && (
                <div>
                  <p className="text-sm mt-4">
                    <span className="font-medium">Penjual:</span> {product.seller}
                  </p>
                </div>
              )}
              <p className="text-sm mt-2">
                <span className="font-medium">Tipe:</span> {product.type}
              </p>
              {/* Access product weight safely with optional chaining or type assertion */}
              {(product as any).weight && (
                <p className="text-sm mt-2">
                  <span className="font-medium">Berat:</span> {(product as any).weight} kg
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-4">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value], index) => (
                        <tr key={key} className={index % 2 === 0 ? "bg-secondary" : ""}>
                          <td className="px-4 py-2 text-sm font-medium">{key}</td>
                          <td className="px-4 py-2 text-sm">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada spesifikasi tersedia.</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-4">
              <div className="space-y-4">
                {product.review_count && product.review_count > 0 ? (
                  <>
                    <p className="text-sm">Ulasan akan ditampilkan di sini.</p>
                    {/* In a real app, you would fetch and display reviews here */}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada ulasan.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Related Products */}
        {/* This would be added in a real app */}
        
        {/* Bottom Add to Cart Bar */}
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-background border-t p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 border-l border-r min-w-[40px] text-center">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={increaseQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              className="flex-1 ml-4 bg-flame-500 hover:bg-flame-600"
              onClick={handleAddToCart}
              disabled={!product.in_stock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {formatRupiah(actualPrice * quantity)}
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ProductDetailPage;
