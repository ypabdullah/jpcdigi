
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/data/models";
import { formatRupiah } from "@/lib/utils";
import { Icons } from "@/components/Icons";
import { Helmet } from "react-helmet";

const Index = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, count: number, image: string}[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed activeTab state

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch featured products
        const { data: featuredData, error: featuredError } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(2);
          
        if (featuredError) throw featuredError;

        // Fetch discounted products
        const { data: discountData, error: discountError } = await supabase
          .from('products')
          .select('*')
          .not('discount', 'is', null)
          .limit(2);
          
        if (discountError) throw discountError;

        // Get product types for categories
        const { data: typesData, error: typesError } = await supabase
          .from('products')
          .select('type');
          
        if (typesError) throw typesError;
        
        // Process types into categories
        const uniqueTypes = Array.from(new Set(typesData.map(item => item.type)));
        const categoriesData = uniqueTypes.map((type, index) => ({
          id: type,
          name: type,
          count: typesData.filter(item => item.type === type).length,
          image: `/placeholder.svg` // Use default placeholder for now
        }));
        
        // Ensure proper typing for our data
        setFeaturedProducts(featuredData as unknown as Product[] || []);
        setDiscountedProducts(discountData as unknown as Product[] || []);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discount 
        ? product.price * (1 - product.discount / 100) 
        : product.price,
      image: product.images && product.images.length > 0 
        ? product.images[0] 
        : '/placeholder.svg',
      type: product.type,
      quantity: 1
    });
  };

  return (
    <MobileLayout>
      <div className="p-4">
        {/* Hero Banner */}
        <div className="relative rounded-lg overflow-hidden mb-6 bg-gradient-to-r from-charcoal-800 to-charcoal-700 text-white">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Jaya Perkasa Charcoal</h1>
            <p className="mb-4 text-sm text-charcoal-100">
              Coba Gunakan Arang Oven Yang Bersih Dan 3x Lebih Awet
            </p>
            <Link to="/search">
              <Button className="bg-flame-500 hover:bg-flame-600">
                Lihat Produk
              </Button>
            </Link>
          </div>
        </div>

        {/* PPOB Menu Button - New section added above featured products */}
        <div className="mb-6">
          <Card 
            className="overflow-hidden cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-95 transition-opacity"
            onClick={() => navigate("/ppob")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icons.zap className="h-6 w-6 mr-3" />
                  <div>
                    <h2 className="font-bold">Layanan PPOB</h2>
                    <p className="text-xs opacity-90">Pulsa, Paket Data, PLN, BPJS, dan lainnya</p>
                  </div>
                </div>
                <Icons.chevronRight className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Products */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Produk Unggulan</h2>
              <Link to="/search?featured=true" className="text-flame-500 text-sm">
                Lihat Semua
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-flame-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={() => handleAddToCart(product)} 
                  />
                ))}
                {featuredProducts.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Tidak ada produk unggulan
                  </div>
                )}
              </div>
            )}
          </div>
        

        {/* Categories */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Kategori</h2>
              <Link to="/search?category=true" className="text-flame-500 text-sm">
                Lihat Semua
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-flame-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category) => (
                  <Card 
                    key={category.id} 
                    className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/category/${category.id}`)}
                  >
                    <CardContent className="p-3 flex flex-col items-center justify-center">
                      <Icons.package className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-xs text-center">{category.name}</span>
                    </CardContent>
                  </Card>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Tidak ada kategori
                  </div>
                )}
              </div>
            )}
          </div>
        

        {/* Special Offers */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Penawaran Khusus</h2>
              <Link to="/search?discount=true" className="text-flame-500 text-sm">
                Lihat Semua
              </Link>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-flame-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {discountedProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={() => handleAddToCart(product)} 
                  />
                ))}
                {discountedProducts.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Tidak ada produk dengan diskon
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </MobileLayout>
  );
};

type ProductCardProps = {
  product: Product;
  onAddToCart: () => void;
};

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <Link to={`/product/${product.id}`}>
        <div className="h-32 bg-charcoal-100 relative">
          <img
            src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          {product.discount && (
            <span className="absolute top-2 right-2 bg-flame-500 text-white text-xs px-2 py-1 rounded-full">
              {product.discount}% OFF
            </span>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <div className="mb-2">
          <span className="text-xs text-muted-foreground">{product.type}</span>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            {product.discount ? (
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm">
                  {formatRupiah(product.price * (1 - product.discount / 100))}
                </span>
                <span className="text-muted-foreground text-xs line-through">
                  {formatRupiah(product.price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-sm">{formatRupiah(product.price)}</span>
            )}
          </div>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-flame-500 hover:bg-flame-600"
            onClick={onAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Index;
