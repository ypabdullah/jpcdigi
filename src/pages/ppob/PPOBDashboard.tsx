import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/Icons";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PPOBNotifications } from "@/components/ppob/PPOBNotifications";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/integrations/supabase/custom-types";
import CryptoJS from 'crypto-js';

interface Category {
  category_id: string;
  name: string;
  category_name?: string;
}

interface Product {
  product_id: string;
  name: string;
  product_name?: string;
  description: string;
  price: number;
  original_price?: number;
  discount?: number;
  category: string;
  category_id: string;
}

const generateSignature = (username: string, apiKey: string, value: string) => {
  return CryptoJS.MD5(username + apiKey + value).toString();
};

export default function PPOBDashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isTestPurchaseOpen, setIsTestPurchaseOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerNo, setCustomerNo] = useState('');
  const [testPurchaseResult, setTestPurchaseResult] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;
          setUserProfile(profileData);
          if (profileData && typeof profileData.balance === 'number') {
            setBalance(profileData.balance);
          }

          // Fetch notification count
          const { count, error: notifError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('read_status', false);
          if (notifError) throw notifError;
          if (count !== null) setNotificationCount(count);

          // Initialize Digiflazz data
          await initializeDigiflazz();
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal mengambil data pengguna: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timeInterval);
    };
  }, [navigate]);

  const handleTestPurchase = async () => {
    if (!selectedProduct || !customerNo) {
      toast.error('Harap pilih produk dan masukkan nomor pelanggan terlebih dahulu');
      return;
    }

    try {
      setIsFetching(true);
      setError(null);

      // Generate signature for test purchase
      const sign = generateSignature(
        import.meta.env.VITE_DIGIFLAZZ_USERNAME,
        import.meta.env.VITE_DIGIFLAZZ_API_KEY,
        `${selectedProduct.product_id}-${customerNo}`
      );

      const response = await fetch('/api/digiflazz-proxy/v1/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: import.meta.env.VITE_DIGIFLAZZ_USERNAME,
          cmd: 'buy',
          product_id: selectedProduct.product_id,
          customer_no: customerNo,
          price: selectedProduct.price,
          sign: sign
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Test purchase result:', result);
      
      if (result.status === 'success') {
        setTestPurchaseResult(result);
        toast.success('Transaksi berhasil!');
        // Save to Supabase
        await saveTransactionToSupabase(result);
      } else {
        throw new Error(result.message || 'Transaksi gagal');
      }
    } catch (error) {
      console.error('Error in test purchase:', error);
      setError(error.message);
      toast.error('Gagal melakukan transaksi: ' + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const saveTransactionToSupabase = async (transaction: any) => {
    try {
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .insert([{
          ref_id: transaction.data?.ref_id,
          customer_no: customerNo,
          buyer_sku_code: selectedProduct?.product_id,
          status: transaction.status,
          message: transaction.message,
          rc: transaction.data?.rc,
          sn: transaction.data?.sn,
          price: selectedProduct?.price,
          buyer_last_saldo: transaction.data?.buyer_last_saldo,
          tele: transaction.data?.tele,
          wa: transaction.data?.wa,
          transaction_date: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving transaction to Supabase:', error);
      // Don't throw error here as we want to show the transaction result to user
    }
  };

  const initializeDigiflazz = async () => {
    try {
      setIsFetching(true);
      setError(null);

      // Generate signature for category list
      const sign = generateSignature(
        import.meta.env.VITE_DIGIFLAZZ_USERNAME,
        import.meta.env.VITE_DIGIFLAZZ_API_KEY,
        'category-list'
      );

      const response = await fetch('/api/v1/service-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'username': import.meta.env.VITE_DIGIFLAZZ_USERNAME,
          'apiKey': import.meta.env.VITE_DIGIFLAZZ_API_KEY
        },
        body: JSON.stringify({
          cmd: 'category-list',
          username: import.meta.env.VITE_DIGIFLAZZ_USERNAME,
          sign
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Categories response:', result);
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        const transformedCategories = result.data.map(category => ({
          ...category,
          category_id: category.category_id || category.id
        }));
        setCategories(transformedCategories);
      } else {
        console.error('Invalid response format:', result);
        throw new Error(result.message || 'Invalid response format from Digiflazz API');
      }
    } catch (error) {
      console.error('Error initializing Digiflazz:', error);
      setError(error.message);
      toast.error('Gagal mengambil kategori: ' + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchProducts = async (categoryId: string) => {
    try {
      setIsFetching(true);
      setError(null);

      // Generate signature for product list request
      const sign = generateSignature(
        import.meta.env.VITE_DIGIFLAZZ_USERNAME,
        import.meta.env.VITE_DIGIFLAZZ_API_KEY,
        `pricelist-${categoryId}`
      );

      const response = await fetch('/api/digiflazz-proxy/v1/price-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cmd: 'pricelist',
          category_id: categoryId,
          username: import.meta.env.VITE_DIGIFLAZZ_USERNAME,
          sign: sign
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Products response:', result);
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        const transformedProducts = result.data.map(product => ({
          ...product,
          category_id: product.category_id || categoryId,
          category: product.category || categories.find(c => c.category_id === categoryId)?.name || 'Lainnya'
        }));
        setProducts(transformedProducts);
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
      toast.error('Gagal mengambil produk: ' + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <MobileLayout>
      <Helmet>
        <title>JPC Digi - Layanan PPOB</title>
        <style>
          {`
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            @keyframes sparkle {
              0% { opacity: 0.2; }
              50% { opacity: 1; }
              100% { opacity: 0.2; }
            }
            .gradient-bg {
              background-size: 200% 200%;
              animation: gradientShift 8s ease infinite;
            }
            .float {
              animation: float 4s ease-in-out infinite;
            }
            .pulse {
              animation: pulse 2s ease-in-out infinite;
            }
            .sparkle {
              animation: sparkle 1.5s ease-in-out infinite;
            }
          `}
        </style>
      </Helmet>

      {/* Header with status bar and balance */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 text-white" style={{animation: "gradientShift 8s ease infinite"}}>
        {/* Status bar */}
        <div className="flex justify-between items-center p-2 text-xs">

          <div className="flex items-center gap-1">
            <Icons.users className="h-3 w-3 mr-1" /> {userProfile?.name ? userProfile.name.split(' ')[0] : 'Guest'}
           
            <div className="flex items-center gap-0.5 bg-white/20 px-1 rounded">
             
            </div>
          </div>
        </div>

        {/* Balance area */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-lg pulse">
                <Icons.wallet className="h-7 w-7 text-indigo-600" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border border-white pulse" />
            </div>
            <div>
              <div className="text-sm opacity-80 font-medium">Saldo {userProfile?.name ? userProfile.name.split(' ')[0] : ''}</div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold sparkle">{formatRupiah(balance)}</span>
                <div>
                  <Button variant="ghost" size="sm" className="p-0 h-6 text-white hover:bg-white/20 rounded-full">
                    <Icons.refreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white">
                <Icons.bell className="h-6 w-6" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Notifikasi</DialogTitle>
              </DialogHeader>
              <PPOBNotifications onClose={() => setNotificationCount(0)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-4 gap-x-2 sm:gap-x-4 px-4 mt-6 pb-6" style={{perspective: "1000px"}}>
          <div>
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2 text-white"
              onClick={() => navigate("/ppob/scan")}
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-2 shadow-lg float">
                <Icons.qrCode className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium">Pindai</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            className="flex flex-col items-center h-auto py-2 text-white"
            onClick={() => navigate("/ppob/topup")}
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-2 shadow-lg float" style={{animationDelay: "0.2s"}}>
              <div className="relative flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-white"></div>
                <Icons.plus className="h-5 w-5 absolute pulse" />
              </div>
            </div>
            <span className="text-sm font-medium">Isi Saldo</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center h-auto py-2 text-white"
            onClick={() => navigate("/ppob/send")}
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-2 shadow-lg float" style={{animationDelay: "0.4s"}}>
              <div className="relative flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-white"></div>
                <Icons.arrowUpCircle className="h-5 w-5 absolute pulse" />
              </div>
            </div>
            <span className="text-sm font-medium">Kirim</span>
          </Button>

          <Button
            variant="ghost"
            className="flex flex-col items-center h-auto py-2 text-white"
            onClick={() => navigate("/ppob/request")}
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center mb-2 shadow-lg float" style={{animationDelay: "0.6s"}}>
              <div className="relative flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-white"></div>
                <Icons.arrowDownCircle className="h-5 w-5 absolute pulse" />
              </div>
            </div>
            <span className="text-sm font-medium">Minta</span>
          </Button>
        </div>
      </div>

      {/* Main content - white background card with rounded corners */}
      <div className="bg-white p-4 rounded-t-3xl -mt-4 mb-16 shadow-lg" style={{borderTop: "3px solid rgba(129, 140, 248, 0.5)"}}>
        {/* Promo section */}
        <div className="mt-2 mb-6">
          <div className="relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="flex p-3">
              <div className="w-12 h-12 rounded-md overflow-hidden mr-3">
                <div className="bg-gradient-to-br from-orange-400 to-red-600 text-white h-full w-full flex items-center justify-center font-bold pulse">
                🔥
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black">Arang Oven</h3>
                <p className="text-sm text-orange-500">Mulai Rp6.000</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs rounded-md h-8 shadow-md" size="sm">
                Beli
              </Button>
            </div>
          </div>
        </div>

        {/* Categories section */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold mb-2">Kategori Layanan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.category_id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => {
                  setSelectedCategory(category.category_id);
                  fetchProducts(category.category_id);
                }}
              >
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-2 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <Icons.menu className="h-8 w-8 text-blue-600 pulse" />
                </div>
                <span className="text-xs font-medium">{category.name || category.category_name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Products section when category is selected */}
        {selectedCategory && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Produk {categories.find(c => c.category_id === selectedCategory)?.name || 'Semua'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.product_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{product.name || product.product_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">Rp{formatRupiah(product.price || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsTestPurchaseOpen(true);
                        }}
                      >
                        <Icons.refreshCw className="h-4 w-4 mr-2" />
                        Test Pembelian
                      </Button>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => navigate(`/ppob/purchase/${product.product_id}`, { state: { product } })}
                      >
                        <Icons.creditCard className="h-4 w-4 mr-2" />
                        Beli Sekarang
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services section */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 mb-8" style={{perspective: "1000px"}}>
          <div className="flex flex-col items-center" onClick={() => navigate("/ppob/ewallet")}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-1 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <Icons.wallet className="h-7 w-7 text-green-600 pulse" />
            </div>
            <span className="text-xs font-medium">e-Wallet</span>
          </div>

          <div className="flex flex-col items-center" onClick={() => navigate("/ppob/pulsa-data")}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-1 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <Icons.smartphone className="h-7 w-7 text-red-600 pulse" style={{animationDelay: "0.2s"}} />
            </div>
            <span className="text-xs font-medium">Pulsa & Data</span>
          </div>

          <div className="flex flex-col items-center" onClick={() => navigate("/ppob/electricity")}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-1 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <Icons.zap className="h-7 w-7 text-amber-600 pulse" style={{animationDelay: "0.4s"}} />
            </div>
            <span className="text-xs font-medium">Listrik</span>
          </div>

          <div className="flex flex-col items-center" onClick={() => navigate("/ppob/games")}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-1 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <Icons.gamepad className="h-7 w-7 text-blue-600 pulse" style={{animationDelay: "0.6s"}} />
            </div>
            <span className="text-xs font-medium">Games</span>
          </div>

          <div className="flex flex-col items-center" onClick={() => navigate("/ppob/all")}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-1 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <Icons.menu className="h-7 w-7 text-purple-600 pulse" style={{animationDelay: "0.8s"}} />
            </div>
            <span className="text-xs font-medium">Lihat Semua</span>
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="bg-white px-4 py-2 mb-4">
        <div className="flex items-center mb-1">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2">
            <Icons.messageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">berbagi kabar terbaru 📢</p>
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(), "HH:mm", { locale: id })}
          </div>
        </div>

        <div className="flex items-center mb-1">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2">
            <Icons.messageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">berbagi kabar terbaru 📢</p>
          </div>
          <div className="text-xs text-gray-500">02/06</div>
        </div>

        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2">
            <Icons.messageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">berbagi kabar terbaru 📢</p>
          </div>
          <div className="text-xs text-gray-500">01/06</div>
        </div>
      </div>

      {/* Banner image */}
      <div className="px-4 mb-4">
        <div className="bg-primary rounded-xl overflow-hidden">
          <img
            src="https://placehold.co/600x200/0088FF/FFFFFF?text=Layanan+Prioritas"
            alt="Banner promo"
            className="w-full h-32 object-cover"
          />
        </div>
      </div>

      {/* Protection */}
      <div className="bg-white mx-4 rounded-xl border border-gray-200 p-4 mb-20">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Icons.check className="h-5 w-5 text-primary mr-2" />
            <span className="font-semibold text-gray-600">PROTECTION</span>
          </div>
          <Button variant="outline" className="h-8 border-primary text-primary text-xs">
            PELAJARI
          </Button>
        </div>

        <div className="flex border-t border-gray-100 pt-3">
          <div className="flex-1 flex flex-col items-center border-r border-gray-100">
            <div className="flex items-center mb-1">
              <Icons.shield className="h-5 w-5 text-primary mr-1" />
              <span className="text-xl font-bold">7</span>
            </div>
            <span className="text-xs text-gray-600">Aktivitas Terlindungi</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center mb-1">
              <Icons.lightbulb className="h-5 w-5 text-amber-500 mr-1" />
              <span className="text-xl font-bold">2</span>
            </div>
            <span className="text-xs text-gray-600">Rekomendasi Keamanan</span>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/ppob/dashboard")}
        >
          <Icons.home className="h-6 w-6" />
          <span className="text-xs">Beranda</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/ppob/activity")}
        >
          <Icons.activity className="h-6 w-6" />
          <span className="text-xs">Aktivitas</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1 relative"
          onClick={() => navigate("/ppob/scan")}
        >
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center absolute -top-7">
            <div className="flex flex-col items-center">
              <span className="text-white text-xs font-bold">PAY</span>
              <div className="grid grid-cols-2 gap-1">
                <div className="h-2 w-2 bg-white rounded"></div>
                <div className="h-2 w-2 bg-white rounded"></div>
                <div className="h-2 w-2 bg-white rounded"></div>
                <div className="h-2 w-2 bg-white rounded"></div>
              </div>
            </div>
          </div>
          <div className="h-6"></div>
          <span className="text-xs"></span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/ppob/topup")}
        >
          <Icons.inbox className="h-6 w-6" />
          <span className="text-xs">Dompet</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center rounded-none h-auto py-1"
          onClick={() => navigate("/profile")}
        >
          <Icons.users className="h-6 w-6" />
          <span className="text-xs">Saya</span>
        </Button>
      </div>
    </MobileLayout>
  );
}
