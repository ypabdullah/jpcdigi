
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
import { getPPOBServices } from "@/services/ppobService";
import { PPOBService } from '@/integrations/supabase/ppob-types';

interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

function Index() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, count: number, image: string}[]>([]);
  const [serviceCategories, setServiceCategories] = useState<PPOBService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await getPPOBServices();
        setServiceCategories(services);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        // Fetch featured products
        const featuredRes = await fetch('/api/products?featured=true');
        const featuredData = await featuredRes.json();
        setFeaturedProducts(featuredData.products);

        // Fetch discounted products
        const discountedRes = await fetch('/api/products?discounted=true');
        const discountedData = await discountedRes.json();
        setDiscountedProducts(discountedData.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      }
    };

    fetchServices();
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
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
              <Button className="inline-flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Lihat Produk
              </Button>
            </Link>
          </div>
        </div>

        {/* PPOB Menu Button */}
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

        {/* Service Categories */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Layanan PPOB</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-flame-500" />
              </div>
            ) : (
              serviceCategories.map((service) => (
                <Link 
                  key={service.id} 
                  to={service.route}
                  className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    {service.icon ? (
                      <img src={service.icon} alt={`${service.name} icon`} className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 bg-gray-200 rounded-lg" />
                    )}
                  </div>
                  <h3 className="font-medium">{service.name}</h3>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Featured Products */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Produk Terbaru</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-flame-500" />
              </div>
            ) : (
              <>
                {featuredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart} 
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Discounted Products */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Produk Diskon</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-flame-500" />
              </div>
            ) : (
              <>
                {discountedProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart} 
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Kategori</h2>
            <Link to="/search?category=true" className="text-flame-500 text-sm">
              Lihat Semua
            </Link>
          </div>
          
          {isLoading ? (
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
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Tidak ada kategori yang tersedia
                  </p>
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
  onAddToCart: (product: Product) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icons.package className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex flex-col space-y-1">
            <h3 className="font-medium text-sm">{product.name}</h3>
            {product.discount ? (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-primary">
                  {formatRupiah(product.price * (1 - product.discount / 100))}
                </span>
                <span className="text-xs text-gray-500 line-through">
                  {formatRupiah(product.price)}
                </span>
              </div>
            ) : (
              <span className="font-medium text-sm">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            className="w-full" 
            onClick={() => onAddToCart(product)}
          >
            Tambah ke Keranjang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Index;
