import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Helmet } from "react-helmet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Icons } from "@/components/Icons";
import { formatRupiah } from "@/lib/utils";
import { useDigiflazz } from "@/hooks/useDigiflazz";
import { useTransaction } from "@/contexts/TransactionContext";
import { DigiflazzProduct } from "@/services/digiflazz";
import { toast } from "@/components/ui/use-toast";

// Define local product type (mapping from Digiflazz to our UI)
interface PulsaProduct {
  id: string; // buyer_sku_code from Digiflazz
  nominal: string;
  description: string;
  price: number;
  originalPrice?: number;
  validity: string;
  isPopular?: boolean;
}

// Helper to convert Digiflazz products to our UI format
const mapDigiflazzToUIProduct = (product: DigiflazzProduct): PulsaProduct => {
  // Extract nominal from product name (e.g., "Telkomsel Pulsa 5000" -> "5Rb")
  const nominalMatch = product.product_name.match(/\d+/g);
  const nominal = nominalMatch 
    ? parseInt(nominalMatch[0]) >= 1000 
      ? `${Math.floor(parseInt(nominalMatch[0])/1000)}Rb` 
      : nominalMatch[0]
    : '';
    
  // Try to extract validity period from description
  const validityMatch = product.desc.match(/(\d+)\s*hari/i);
  const validity = validityMatch 
    ? `Masa Aktif ${validityMatch[0]}` 
    : 'Masa Aktif Sesuai Provider';
    
  // Calculate if there's a discount (assuming 5% markup from seller price is normal)
  const marketPrice = Math.ceil(product.price * 1.05);
  const hasDiscount = product.price < marketPrice;
  
  return {
    id: product.buyer_sku_code,
    nominal: nominal,
    description: product.product_name,
    price: product.price,
    originalPrice: hasDiscount ? marketPrice : undefined,
    validity: validity,
    // Mark products as popular based on stock or other criteria
    isPopular: product.stock > 1000 || product.product_name.toLowerCase().includes('popular'),
  };
};

// Default empty arrays for products
const emptyProducts: PulsaProduct[] = [];

export default function PPOBPulsaDataPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savedNumbers, setSavedNumbers] = useState<string[]>(["0813 9458 6882", "0822 6015 2977"]);
  const [activeTab, setActiveTab] = useState("pulsa");
  const [selectedProduct, setSelectedProduct] = useState<PulsaProduct | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [carrier, setCarrier] = useState("Telkomsel");
  const [pulsaProducts, setPulsaProducts] = useState<PulsaProduct[]>(emptyProducts);
  const [dataProducts, setDataProducts] = useState<PulsaProduct[]>(emptyProducts);
  const [error, setError] = useState<string | null>(null);
  
  // Use our Digiflazz hook
  const digiflazz = useDigiflazz();
  
  // Use our transaction context
  const { addTransaction } = useTransaction();

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Memproses pembayaran...</p>
      </div>
    </div>
  );

  // Format phone number as it's typed
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    
    // Format with spaces
    let formattedValue = "";
    for (let i = 0; i < numericValue.length; i++) {
      if (i === 4 || i === 8) {
        formattedValue += " ";
      }
      formattedValue += numericValue[i];
    }
    
    return formattedValue;
  };

  // Handle phone number change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    
    // Determine carrier based on prefix
    const prefix = formatted.replace(/\s/g, "").substring(0, 4);
    if (["0811", "0812", "0813", "0821", "0822", "0823"].includes(prefix)) {
      setCarrier("Telkomsel");
    } else if (["0817", "0818", "0819", "0859", "0877", "0878"].includes(prefix)) {
      setCarrier("XL Axiata");
    } else if (["0851", "0852", "0853", "0815", "0816"].includes(prefix)) {
      setCarrier("Indosat Ooredoo");
    } else if (["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"].includes(prefix)) {
      setCarrier("Smartfren");
    } else if (["0896", "0897", "0898", "0899"].includes(prefix)) {
      setCarrier("Tri Indonesia");
    } else {
      setCarrier("Unknown");
    }
  };

  // Select a saved number
  const selectSavedNumber = (number: string) => {
    setPhoneNumber(number);
  };

  // Select a product
  const selectProduct = (product: PulsaProduct) => {
    setSelectedProduct(product);
    setIsConfirmDialogOpen(true);
  };

  // Fetch products from Digiflazz
  const fetchProductsFromDigiflazz = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get products based on active tab
      const category = activeTab === "pulsa" ? "Pulsa" : "Data";
      const products = await digiflazz.fetchProducts(category);
      
      // Map Digiflazz products to our UI format
      const mappedProducts = products
        .filter(p => {
          const cleanPhone = phoneNumber.replace(/\D/g, '');
          // Only show products for the detected carrier
          if (carrier === "Telkomsel") {
            return p.brand.toLowerCase().includes("telkomsel");
          } else if (carrier === "XL Axiata") {
            return p.brand.toLowerCase().includes("xl");
          } else if (carrier === "Indosat Ooredoo") {
            return p.brand.toLowerCase().includes("indosat");
          } else if (carrier === "Smartfren") {
            return p.brand.toLowerCase().includes("smartfren");
          } else if (carrier === "Tri Indonesia") {
            return p.brand.toLowerCase().includes("tri") || p.brand.toLowerCase().includes("3");
          }
          return true; // Show all products if carrier is unknown
        })
        .map(mapDigiflazzToUIProduct);
      
      // Sort products by price
      mappedProducts.sort((a, b) => a.price - b.price);
      
      // Update state based on active tab
      if (activeTab === "pulsa") {
        setPulsaProducts(mappedProducts);
      } else {
        setDataProducts(mappedProducts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process purchase through Digiflazz API
  const processPurchase = async () => {
    if (!selectedProduct || !phoneNumber) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean phone number (remove spaces and other non-numeric characters)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Process transaction using Digiflazz API
      const response = await digiflazz.processPrepaidTransaction(
        cleanPhone,
        selectedProduct.id,
        true // Use test mode for safety
      );
      
      if (response && response.data && response.data.status === "success") {
        // Add transaction to history context
        addTransaction({
          id: response.data.ref_id || `tx-${Date.now()}`,
          type: "PPOB",
          subtype: activeTab === "pulsa" ? "Pulsa" : "Data",
          amount: selectedProduct.price,
          date: new Date().toISOString(),
          description: `${selectedProduct.description} ${phoneNumber}`,
          status: "success",
        });
        
        // Show success state
        setIsSuccess(true);
        
        // Show toast notification
        toast({
          title: "Pembayaran Berhasil",
          description: `Pembelian ${selectedProduct.description} untuk nomor ${phoneNumber} telah berhasil.`,
        });
      } else {
        throw new Error(response.data?.message || "Transaction failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      toast({
        variant: "destructive",
        title: "Pembayaran Gagal",
        description: err instanceof Error ? err.message : 'Gagal memproses pembayaran. Silakan coba lagi.',
      });
      setIsConfirmDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for URL query params for tab selection and handle carrier detection
  useEffect(() => {
    // Parse query parameters for tab selection
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    
    // Set active tab if valid param is found
    if (tabParam === "pulsa" || tabParam === "data") {
      setActiveTab(tabParam);
    }
    
    // Detect carrier from phone number if present
    if (phoneNumber) {
      const prefix = phoneNumber.replace(/\s/g, "").substring(0, 4);
      if (["0811", "0812", "0813", "0821", "0822", "0823"].includes(prefix)) {
        setCarrier("Telkomsel");
      } else if (["0817", "0818", "0819", "0859", "0877", "0878"].includes(prefix)) {
        setCarrier("XL Axiata");
      } else if (["0851", "0852", "0853", "0815", "0816"].includes(prefix)) {
        setCarrier("Indosat Ooredoo");
      } else if (["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"].includes(prefix)) {
        setCarrier("Smartfren");
      } else if (["0896", "0897", "0898", "0899"].includes(prefix)) {
        setCarrier("Tri Indonesia");
      } else {
        setCarrier("Unknown");
      }
    }
  }, [location.search, phoneNumber]);
  
  // Fetch products when phone number or active tab changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 4) {
      fetchProductsFromDigiflazz();
    }
  }, [phoneNumber, activeTab]);
  
  // Update URL query params when tab changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("tab", activeTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, navigate, location.pathname, location.search]);

  return (
    <MobileLayout>
      <Helmet>
        <title>Pulsa & Data - JPC Digi</title>
      </Helmet>
      
      <div className="w-full max-w-xl mx-auto space-y-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between p-4 bg-primary text-white">
          <div className="flex items-center">
            <button onClick={() => navigate("/ppob/dashboard")} className="mr-3">
              <Icons.chevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">Pulsa & Paket Data</h1>
          </div>
          <button>
            <Icons.file className="h-5 w-5" />
          </button>
        </div>
        
        {/* Main content */}
        <div className="p-4 bg-white">
          {/* Phone number input section */}
          <div className="bg-white rounded-lg mb-4">
            <div className="border-b border-gray-100 py-2 px-1">
              <p className="text-gray-500 text-sm mb-1">NOMOR HP</p>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="Masukkan nomor handphone"
                className="border-none text-lg px-0 focus-visible:ring-0"
              />
            </div>
            
            {/* Detected carrier display */}
            {phoneNumber && (
              <div className="py-2 px-1 flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <Icons.smartphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">{carrier}</p>
                </div>
              </div>
            )}
            
            {/* Saved numbers */}
            {savedNumbers.length > 0 && (
              <div className="pt-2 pb-3">
                <p className="text-sm text-gray-500 mb-2 px-1">Nomor Tersimpan</p>
                <div className="flex flex-wrap gap-2 px-1">
                  {savedNumbers.map((number, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSavedNumber(number)}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Tab buttons */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab("pulsa")}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === "pulsa" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Pulsa
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === "data" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Paket Data
            </button>
          </div>
          
          {/* Products grid */}
          {digiflazz.loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icons.alertTriangle className="h-8 w-8 text-destructive mb-2" />
              <h3 className="font-medium">Error</h3>
              <p className="text-sm text-gray-500">{error}</p>
              <Button onClick={fetchProductsFromDigiflazz} variant="outline" size="sm" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {activeTab === "pulsa" ? (
                <div className="grid grid-cols-2 gap-4">
                  {pulsaProducts.length === 0 && !digiflazz.loading ? (
                    <div className="col-span-2 text-center p-4">
                      <p className="text-gray-500">Masukkan nomor HP untuk melihat pilihan pulsa</p>
                    </div>
                  ) : (
                    pulsaProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className={`cursor-pointer hover:border-primary transition-colors ${product.isPopular ? 'border-amber-400' : ''}`}
                        onClick={() => selectProduct(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="font-semibold text-xl">{product.nominal}</div>
                            {product.isPopular && (
                              <div className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                                Popular
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{product.validity}</p>
                          <div className="mt-3">
                            {product.originalPrice && (
                              <span className="text-xs text-gray-400 line-through mr-2">
                                {formatRupiah(product.originalPrice)}
                              </span>
                            )}
                            <span className="text-primary font-medium">
                              {formatRupiah(product.price)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {dataProducts.length === 0 && !digiflazz.loading ? (
                    <div className="text-center p-4">
                      <p className="text-gray-500">Masukkan nomor HP untuk melihat pilihan paket data</p>
                    </div>
                  ) : (
                    dataProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => selectProduct(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{product.description}</div>
                              <p className="text-xs text-gray-400 mt-0.5">{product.validity}</p>
                            </div>
                            <div className="text-primary font-medium">
                              {formatRupiah(product.price)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                <DialogDescription>
                  Pastikan nomor handphone dan produk yang dipilih sudah benar.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nomor Handphone</span>
                    <span className="font-medium">{phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider</span>
                    <span>{carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Produk</span>
                    <span>{selectedProduct?.description}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between font-medium">
                    <span>Total Harga</span>
                    <span className="text-amber-500">{formatRupiah(selectedProduct?.price)}</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button 
                  type="button"
                  onClick={processPurchase}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : "Bayar Sekarang"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Icons.check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-center">Pembayaran Berhasil!</h2>
              <p className="text-center text-gray-500">
                Pembelian {selectedProduct?.description} untuk nomor {phoneNumber} telah berhasil.
              </p>
              
              <Button 
                className="mt-4 w-full" 
                onClick={() => {
                  setIsConfirmDialogOpen(false);
                  setIsSuccess(false);
                }}
              >
                Kembali
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Loading overlay */}
      {isLoading && <LoadingSpinner />}
    </MobileLayout>
  );
}
