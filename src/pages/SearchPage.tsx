
import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ShoppingCart, Search, Filter, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { type SortOption, type FilterOptions, Product } from "@/data/models";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    priceRange: [0, 100],
    types: [],
    origins: []
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  
  const { addItem } = useCart();

  // Fetch all products and metadata on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch all products
        const { data, error } = await supabase
          .from('products')
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          setProducts(data);
          
          // Extract unique origins
          const uniqueOrigins = Array.from(new Set(data.map(p => p.origin).filter(Boolean) as string[]));
          setOrigins(uniqueOrigins);
          
          // Extract unique types
          const uniqueTypes = Array.from(new Set(data.map(p => p.type).filter(Boolean) as string[]));
          setTypes(uniqueTypes);
          
          // Find min and max prices
          if (data.length > 0) {
            const prices = data.map(p => p.price);
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setMinPrice(min);
            setMaxPrice(max);
            setFilterOptions(prev => ({
              ...prev,
              priceRange: [min, max]
            }));
          }
        }
      } catch (error: any) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Gagal memuat produk",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters when products, search params or filter options change
  useEffect(() => {
    if (loading) return;
    
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const discount = searchParams.get("discount");
    const querySearchTerm = searchParams.get("q");
    
    if (querySearchTerm && querySearchTerm !== searchTerm) {
      setSearchTerm(querySearchTerm);
    }
    
    let filtered = [...products];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }
    
    // Apply category filter
    if (category) {
      filtered = filtered.filter(product => product.type === category);
    }
    
    // Apply featured filter
    if (featured === "true") {
      filtered = filtered.filter(product => product.featured === true);
    }
    
    // Apply discount filter
    if (discount === "true") {
      filtered = filtered.filter(product => product.discount !== null && product.discount > 0);
    }
    
    // Apply additional filters
    filtered = filtered.filter(product => {
      // Price range filter
      const productPrice = product.price;
      if (productPrice < filterOptions.priceRange[0] || productPrice > filterOptions.priceRange[1]) {
        return false;
      }
      
      // Type filter
      if (filterOptions.types.length > 0 && !filterOptions.types.includes(product.type)) {
        return false;
      }
      
      // Origin filter
      if (filterOptions.origins.length > 0 && 
          (!product.origin || !filterOptions.origins.includes(product.origin))) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting
    switch (sortOption) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }
    
    setFilteredProducts(filtered);
  }, [products, searchParams, searchTerm, sortOption, filterOptions, loading]);

  const handleSearch = () => {
    setSearchParams(prev => {
      if (searchTerm) {
        prev.set("q", searchTerm);
      } else {
        prev.delete("q");
      }
      return prev;
    });
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discount 
        ? product.price * (1 - product.discount / 100) 
        : product.price,
      image: product.images && product.images.length > 0 
        ? product.images[0] 
        : '/https://image1ws.indotrading.com/s3/productimages/webp/co263038/p1282683/w600-h600/f43a666d-eca7-4cb4-aa14-450eae21f24f.jpg',
      type: product.type,
      quantity: 1
    });
    
    toast({
      title: "Ditambahkan ke keranjang",
      description: `${product.name} telah ditambahkan ke keranjang belanja Anda.`
    });
  };
  
  const toggleTypeFilter = (type: string) => {
    setFilterOptions(prev => {
      const types = [...prev.types];
      const typeIndex = types.indexOf(type);
      
      if (typeIndex > -1) {
        types.splice(typeIndex, 1);
      } else {
        types.push(type);
      }
      
      return { ...prev, types };
    });
  };
  
  const toggleOriginFilter = (origin: string) => {
    setFilterOptions(prev => {
      const origins = [...prev.origins];
      const originIndex = origins.indexOf(origin);
      
      if (originIndex > -1) {
        origins.splice(originIndex, 1);
      } else {
        origins.push(origin);
      }
      
      return { ...prev, origins };
    });
  };
  
  const handlePriceRangeChange = (values: number[]) => {
    setFilterOptions(prev => ({
      ...prev,
      priceRange: [values[0], values[1]]
    }));
  };
  
  const clearFilters = () => {
    setFilterOptions({
      priceRange: [minPrice, maxPrice],
      types: [],
      origins: []
    });
  };

  return (
    <MobileLayout>
      <div className="p-4">
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Cari produk arang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <Button onClick={handleSearch} className="bg-flame-500 hover:bg-flame-600">
            Search
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filter Produk</SheetTitle>
                <SheetDescription>
                  Filter produk berdasarkan kategori, harga, dan rating.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Filter</h3>
                  <Select
                    value={sortOption}
                    onValueChange={(val) => setSortOption(val as SortOption)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-asc">Harga: Terendah ke Tertinggi</SelectItem>
                      <SelectItem value="price-desc">Harga: Tertinggi ke Terendah</SelectItem>
                      <SelectItem value="rating">Rating Terbaik</SelectItem>
                      <SelectItem value="newest">Terbaru</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="my-4" />
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Range Harga</h3>
                  <div className="px-2">
                    <Slider 
                      max={maxPrice} 
                      min={minPrice}
                      step={1} 
                      value={[filterOptions.priceRange[0], filterOptions.priceRange[1]]}
                      onValueChange={handlePriceRangeChange}
                    />
                    <div className="flex justify-between mt-2 text-sm">
                      <span>Rp {filterOptions.priceRange[0]}</span>
                      <span>Rp {filterOptions.priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Tipe Charcoal</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {types.map(type => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          checked={filterOptions.types.includes(type)}
                          onChange={() => toggleTypeFilter(type)}
                          className="mr-2"
                        />
                        <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Asal</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {origins.map(origin => (
                      <div key={origin} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`origin-${origin}`}
                          checked={filterOptions.origins.includes(origin)}
                          onChange={() => toggleOriginFilter(origin)}
                          className="mr-2"
                        />
                        <label htmlFor={`origin-${origin}`} className="text-sm">{origin}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={clearFilters} className="mr-2">
                    Hapus Semua
                  </Button>
                  <SheetTrigger asChild>
                    <Button>Terapkan Filter</Button>
                  </SheetTrigger>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Search Results */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Hasil Pencarian</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredProducts.length} produk ditemukan
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-flame-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-none shadow-sm">
                  <Link to={`/product/${product.id}`}>
                    <div className="h-32 bg-charcoal-100 relative">
                      <img
                        src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg'}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                      {product.discount && product.discount > 0 && (
                        <span className="absolute top-2 right-2 bg-flame-500 text-white text-xs px-2 py-1 rounded-full">
                          {product.discount}% DISKON
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
                        {product.discount && product.discount > 0 ? (
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
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-lg font-medium">Tidak ada produk ditemukan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Coba sesuaikan pencarian atau kriteria filter Anda
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default SearchPage;
