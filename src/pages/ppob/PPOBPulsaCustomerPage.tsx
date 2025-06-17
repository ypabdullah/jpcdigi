import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/utils";
import { useTransaction } from "@/contexts/TransactionContext";
import { TransactionResponse } from "@/services/digiflazz";
import toast from 'react-hot-toast';
import { digiflazzService } from "@/services/digiflazz";
import { DigiflazzProduct } from "@/services/digiflazz";
import { useDigiflazz } from "@/hooks/useDigiflazz";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from '../../integrations/supabase/client';

interface PulsaProduct {
  id: string;
  nominal: string;
  description: string;
  price: number;
  originalPrice?: number;
  validity: string;
  isPopular?: boolean;
}

const mapDigiflazzToUIProduct = (product: any): PulsaProduct => {
  // Extract nominal from buyer_sku_code (format: SKU_NOMINAL)
  const nominalMatch = product.buyer_sku_code.match(/_(\d+)/);
  const nominal = nominalMatch 
    ? parseInt(nominalMatch[1]) >= 1000 
      ? `${Math.floor(parseInt(nominalMatch[1])/1000)}Rb` 
      : nominalMatch[1]
    : '';
  
  // Extract validity from description
  const descText = product.desc || product.product_desc || '';
  const validityMatch = descText.match(/(\d+)\s*hari/i);
  const validity = validityMatch 
    ? `Masa Aktif ${validityMatch[0]}` 
    : 'Masa Aktif Sesuai Provider';
    
  return {
    id: product.buyer_sku_code,
    nominal,
    description: product.product_name,
    price: product.price,
    validity,
    isPopular: product.seller_product_status,
  };
};

const PPOBPulsaCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransaction();
  const { processPrepaidTransaction } = useDigiflazz();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PulsaProduct | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operator, setOperator] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Function to detect operator from phone number
  const detectOperator = (number: string) => {
    if (number.length < 4) return '';
    const prefix = number.substring(0, 4);
    const operatorMap: Record<string, string> = {
      '0811': 'Telkomsel',
      '0812': 'Telkomsel',
      '0813': 'Telkomsel',
      '0821': 'Telkomsel',
      '0822': 'Telkomsel',
      '0823': 'Telkomsel',
      '0852': 'Telkomsel',
      '0853': 'Telkomsel',
      '0851': 'Telkomsel',
      '0814': 'Indosat',
      '0815': 'Indosat',
      '0816': 'Indosat',
      '0855': 'Indosat',
      '0856': 'Indosat',
      '0857': 'Indosat',
      '0858': 'Indosat',
      '0877': 'XL',
      '0878': 'XL',
      '0817': 'XL',
      '0818': 'XL',
      '0819': 'XL',
      '0859': 'XL',
      '0838': 'Axis',
      '0831': 'Axis',
      '0832': 'Axis',
      '0833': 'Axis',
      '0895': 'Tri',
      '0896': 'Tri',
      '0897': 'Tri',
      '0898': 'Tri',
      '0899': 'Tri',
      '0881': 'Smartfren',
      '0882': 'Smartfren',
      '0883': 'Smartfren',
      '0884': 'Smartfren',
      '0885': 'Smartfren',
      '0886': 'Smartfren',
      '0887': 'Smartfren',
      '0888': 'Smartfren',
      '0889': 'Smartfren'
    };
    return operatorMap[prefix] || '';
  };

  useEffect(() => {
    if (phoneNumber.length >= 4) {
      const detectedOperator = detectOperator(phoneNumber);
      setOperator(detectedOperator);
    } else {
      setOperator('');
    }
  }, [phoneNumber]);

  // Filter products based on detected operator
  const filteredProducts = useMemo(() => {
    if (!operator) return products;
    console.log("Detected operator:", operator);
    console.log("Available brands in products:", [...new Set(products.map(p => p.brand))]);
    
    // Handle different possible names for the provider
    let brandNames = [operator];
    if (operator === 'Tri') {
      brandNames = ["Tri", "Three", "3"]; // Check multiple variations
    } else if (operator === 'Telkomsel') {
      brandNames = ["Telkomsel", "Simpati", "Kartu As"];
    } else if (operator === 'Indosat') {
      brandNames = ["Indosat", "IM3", "Mentari"];
    }
    
    const filtered = products.filter(product => 
      product.brand && brandNames.some(name => 
        product.brand.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    console.log("Filtered products count:", filtered.length);
    return filtered;
  }, [operator, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('digiflazz_products')
          .select('*')
          .eq('category', 'Pulsa')
          .order('price', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast.error(`Gagal memuat produk: ${error.message || 'Unknown error'}`, { duration: 5000 });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleTopup = async () => {
    console.log("Lanjutkan Transaksi button clicked");
    if (!selectedProduct || !phoneNumber) {
      toast("Mohon isi nomor telepon dan pilih nominal pulsa.", { duration: 5000 });
      setErrorMessage("Mohon isi nomor telepon dan pilih nominal pulsa.");
      return;
    }

    if (phoneNumber.length < 10) {
      toast("Nomor telepon tidak valid.", { duration: 5000 });
      setErrorMessage("Nomor telepon tidak valid.");
      return;
    }

    // Show confirmation dialog before processing transaction
    console.log("Showing confirmation dialog");
    setShowConfirmDialog(true);
  };

  const handleConfirmTransaction = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      console.log("Processing transaction for product:", selectedProduct);
      console.log("Phone number:", phoneNumber);

      // Process the transaction through the useDigiflazz hook
      const response: TransactionResponse = await processPrepaidTransaction(
        phoneNumber,
        selectedProduct!.id
      );

      console.log("Transaction response:", response);

      if (response.data.status === "Sukses") {
        // Transaction successful
        setSuccessMessage(response.data.message);
        toast.success(response.data.message, { duration: 10000 });

        // Save transaction to Supabase
        try {
          console.log('Attempting to save transaction to Supabase table transaksi_digiflazz');
          if (!supabase) {
            console.error('Supabase client is not initialized');
            toast.error('Database client tidak tersedia', { duration: 5000 });
            return;
          }
          console.log('Supabase client initialized with URL:', import.meta.env.VITE_SUPABASE_URL || 'Not set');
          console.log('Supabase client initialized with Anon Key (first 10 chars):', (import.meta.env.VITE_SUPABASE_ANON_KEY || 'Not set').substring(0, 10) + '...');
          const { data, error } = await supabase
            .from('transaksi_digiflazz')
            .insert([
              {
                ref_id: response.data.ref_id,
                customer_no: response.data.customer_no,
                buyer_sku_code: response.data.buyer_sku_code,
                message: response.data.message,
                status: response.data.status,
                rc: response.data.rc,
                sn: response.data.sn,
                price: response.data.price,
                created_at: new Date().toISOString(),
              },
            ]);

          if (error) {
            console.error('Error saving transaction to Supabase:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            toast.error(`Gagal menyimpan transaksi ke database: ${error.message}`, { duration: 5000 });
          } else {
            console.log('Transaction saved to Supabase:', data);
            toast.success('Transaksi berhasil disimpan ke database', { duration: 5000 });
          }
        } catch (error: any) {
          console.error('Unexpected error saving transaction:', error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          toast.error(`Gagal menyimpan transaksi: ${error.message || 'Unknown error'}`, { duration: 5000 });
        }

        // Add to transaction context (if needed)
        addTransaction({
          id: response.data.ref_id,
          type: "Pulsa",
          amount: response.data.price,
          date: new Date().toISOString(),
          status: "completed",
          description: `Pulsa untuk ${phoneNumber}`
        });

        // Navigate to receipt page after a short delay
        setTimeout(() => {
          navigate(`/receipt/${response.data.ref_id}`, {
            state: { transaction: response.data, recipient: phoneNumber },
          });
        }, 3000);
      } else {
        // Transaction failed
        setErrorMessage(response.data.message || "Transaksi gagal. Silakan coba lagi.");
        toast.error(response.data.message || "Transaksi gagal. Silakan coba lagi.", { duration: 10000 });
      }
    } catch (error: any) {
      console.error("Error processing transaction:", error);
      setErrorMessage(error.message || "Terjadi kesalahan. Silakan coba lagi.");
      toast.error(error.message || "Terjadi kesalahan. Silakan coba lagi.", { duration: 10000 });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
    }
  };

  const handleProductSelect = (value: string) => {
    const selected = products.find(product => product.buyer_sku_code === value);
    if (selected) {
      setSelectedProduct(mapDigiflazzToUIProduct(selected));
    }
  };

  return (
    <MobileLayout>
      <Helmet>
        <title>Transaksi Pulsa - JPC Digital</title>
      </Helmet>

      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Transaksi Pulsa</h1>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
                <Input
                  type="tel"
                  placeholder="Masukkan nomor telepon"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full"
                />
                {operator && (
                  <p className="text-sm text-gray-500 mt-1">Operator: {operator}</p>
                )}
              </div>

              <label className="block text-sm font-medium mb-1">Pilih Nominal Pulsa</label>
              <Select 
                value={selectedProduct ? selectedProduct.id : ""} 
                onValueChange={handleProductSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih nominal pulsa" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProducts ? (
                    <div className="p-2 text-gray-500">Memuat produk...</div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <SelectItem key={product.buyer_sku_code} value={product.buyer_sku_code}>
                        {product.product_name} - Rp {product.price.toLocaleString()}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">Tidak ada produk tersedia untuk operator ini.</div>
                  )}
                </SelectContent>
              </Select>

              <Button
                onClick={handleTopup}
                disabled={!phoneNumber || !selectedProduct || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Lanjutkan Transaksi"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Transaksi</DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  <p>Nomor Tujuan: {phoneNumber}</p>
                  <p>Nominal: {selectedProduct?.nominal}</p>
                  <p>Harga: {selectedProduct && formatRupiah(selectedProduct.price)}</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmTransaction}
                disabled={isProcessing}
              >
                {isProcessing ? "Memproses..." : "Konfirmasi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default PPOBPulsaCustomerPage;
