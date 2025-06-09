import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import AdminDialog from '../../components/admin/AdminDialog';
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Icons } from "@/components/Icons";
import { supabase } from '../../integrations/supabase/client';
import { PPOBService, PPOBProduct, PPOBTransaction } from '../../integrations/supabase/ppob-types';
import { getPPOBServices, getPPOBProducts, getPPOBTransactions } from '../../services/ppobService';
import CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import { RealtimeChannel } from "@supabase/supabase-js";
import { dataTagSymbol } from "@tanstack/react-query";

export default function PPOBAdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<PPOBService[]>([]);
  const [products, setProducts] = useState<PPOBProduct[]>([]);
  const [digiflazzProducts, setDigiflazzProducts] = useState<any[]>([]);
  const [digiflazzCategories, setDigiflazzCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<PPOBTransaction[]>([]);
  const [digiflazzTransactions, setDigiflazzTransactions] = useState<any[]>([]);
  const [supabaseTransactions, setSupabaseTransactions] = useState<any[]>([]);
  const [digiflazzConfig, setDigiflazzConfig] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PPOBService | PPOBProduct | null>(null);
  const [currentFormType, setCurrentFormType] = useState<'service' | 'product' | 'digiflazz' | 'transaction'>('service');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customerNo, setCustomerNo] = useState<string>('');
  const [plnValidationResult, setPlnValidationResult] = useState<any>(null);
  const [isValidatingPln, setIsValidatingPln] = useState<boolean>(false);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [supabaseChannel, setSupabaseChannel] = useState<RealtimeChannel | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const servicesData = await getPPOBServices();
        setServices(servicesData || []);
        // Fetch all products without filtering by service ID
        const productsData = await supabase.from('ppob_products').select('*');
        setProducts(productsData.data || []);
        // Fetch all transactions without filtering by user ID
        const transactionsData = await supabase.from('ppob_transactions').select('*').order('transaction_date', { ascending: false });
        setTransactions(transactionsData.data || []);
        
        // Load Digiflazz configuration
        const { data: configData, error } = await supabase
          .from('digiflazz_config')
          .select('*')
          .single();
        if (error) {
          console.error('Error loading Digiflazz config:', error);
          // If table doesn't exist or no records, initialize with empty config
          setDigiflazzConfig({ id: '', api_key: '', username: '', mode: 'development' });
        } else {
          setDigiflazzConfig(configData || { id: '', api_key: '', username: '', mode: 'development' });
        }
      } catch (error) {
        console.error(`Error loading data:`, error);
        alert(`Failed to load data`);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Load Digiflazz products when tab changes to products
  useEffect(() => {
    if (activeTab === 'digiflazz' && digiflazzConfig && digiflazzConfig.api_key && digiflazzConfig.username) {
      const fetchDigiflazzProducts = async () => {
        setIsLoading(true);
        try {
          const functionUrl = '/digiflazz-proxy/v1/price-list';
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: digiflazzConfig.username,
              apiKey: digiflazzConfig.api_key
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Digiflazz API Response:', data); // Log response for debugging
          if (data && Array.isArray(data.data)) {
            setDigiflazzProducts(data.data);
            // Extract unique categories from Digiflazz products for service selection
            const categories = [...new Set(data.data.map(product => product.category))];
            setDigiflazzCategories(categories.map(cat => ({ id: cat, name: cat })));
          } else {
            console.error('Unexpected data structure from Digiflazz API', data);
            setDigiflazzProducts([]);
            setDigiflazzCategories([]);
          }
        } catch (error) {
          console.error('Error fetching Digiflazz products:', error);
          setDigiflazzProducts([]);
          setDigiflazzCategories([]);
          alert('Failed to fetch products from Digiflazz API');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchDigiflazzProducts();
    }
  }, [activeTab, digiflazzConfig]);

  useEffect(() => {
    if (activeTab === 'transactions' && digiflazzConfig && digiflazzConfig.api_key && digiflazzConfig.username) {
      fetchDigiflazzTransactions();
      fetchSupabaseTransactions();
    }
  }, [activeTab, digiflazzConfig]);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!supabase) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("transaksi_digiflazz")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        setTransactionHistory(data || []);
      } catch (err: any) {
        console.error('Error fetching transaction history:', err);
        setTransactionHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactionHistory();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    
    const channel = supabase
      .channel("transactions")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "transaksi_digiflazz"
      }, (payload) => {
        console.log("New transaction received:", payload);
        setTransactionHistory(prev => [payload.new, ...prev]);
        toast({
          title: "Transaksi Baru",
          description: `Transaksi baru dengan ID ${payload.new.ref_id} telah diterima.`
        });
      })
      .subscribe();
      
    setSupabaseChannel(channel);
    
    return () => {
      if (channel) {
        channel.unsubscribe();
        setSupabaseChannel(null);
      }
    };
  }, [supabase, toast]);

  const fetchDigiflazzTransactions = async () => {
    setIsLoading(true);
    try {
      const functionUrl = '/digiflazz-proxy/v1/transaction-history';
      const signRaw = `${digiflazzConfig.username}${digiflazzConfig.api_key}history`;
      const sign = CryptoJS.MD5(signRaw).toString();
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: digiflazzConfig.username,
          sign: sign
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Transaction history endpoint not found. This feature may not be implemented in the proxy yet.');
          setDigiflazzTransactions([]);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        console.log('Digiflazz Transaction History Response:', data); // Log response for debugging
        if (data && Array.isArray(data.data)) {
          setDigiflazzTransactions(data.data);
        } else {
          console.error('Unexpected transaction data structure from Digiflazz API', data);
          setDigiflazzTransactions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching Digiflazz transactions:', error);
      setDigiflazzTransactions([]);
      alert('Failed to fetch transactions from Digiflazz API');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupabaseTransactions = async () => {
    if (!supabase) return;
    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transaksi_digiflazz')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setSupabaseTransactions(data);
      } else {
        setSupabaseTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching Supabase transactions:', err);
      toast.error('Gagal memuat transaksi dari Supabase');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const saveTransactionToSupabase = async (transaction: PPOBTransaction) => {
    if (!supabase) return;
    try {
      // Remove id and updated_at to let Supabase handle them if they are serial and timestamp with default now()
      const { id, updated_at, ...transactionData } = transaction;
      const { data, error } = await supabase
        .from('transaksi_digiflazz')
        .upsert([transactionData], { onConflict: 'ref_id' });
      if (error) throw error;
      toast.success('Transaksi berhasil disimpan ke Supabase');
    } catch (err: any) {
      console.error('Error saving transaction to Supabase:', err);
      toast.error('Gagal menyimpan transaksi ke Supabase');
    }
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 1500);
  };

  const handleAdd = (type: 'service' | 'product' | 'digiflazz' | 'transaction') => {
    setSelectedItem(null);
    setCurrentFormType(type);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: PPOBService | PPOBProduct | any) => {
    setSelectedItem(item);
    if ('category' in item) {
      // It's a service
      const service = item as PPOBService;
      setCurrentFormType('service');
      setSelectedService(service.id);
    } else if ('price' in item && !('ref_id' in item)) {
      // It's a product
      const product = item as PPOBProduct;
      setCurrentFormType('product');
      setSelectedProduct(product.id);
    } else if ('ref_id' in item) {
      // It's a transaction
      setCurrentFormType('transaction');
    } else {
      // It's a Digiflazz config
      setCurrentFormType('digiflazz');
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: PPOBService | PPOBProduct) => {
    setIsDeleting(true);
    try {
      const id = item.id;
      if (!id) return;
      const table = 'category' in item ? "ppob_services" : "ppob_products";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      if ('category' in item) {
        setServices(services.filter(s => s.id !== id));
      } else {
        setProducts(products.filter(p => p.id !== id));
      }
      alert("Deleted successfully");
    } catch (error) {
      console.error(`Error deleting item:`, error);
      alert(`Failed to delete item`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveItem = async (data: any, type: string) => {
    setIsLoading(true);
    try {
      if (type === 'transaction') {
        if (selectedItem && selectedItem.id) {
          await handleUpdateTransaction(selectedItem.id, data);
        } else {
          // Adding a new transaction manually is not typical, but we'll support it
          const { error } = await supabase.from('transaksi_digiflazz').insert([data]);
          if (error) throw error;
          alert('Transaksi berhasil ditambahkan ke database.');
          fetchSupabaseTransactions(); // Refresh the list
        }
      } else {
        // Handle save for other types (service, product, digiflazz)
        if (selectedItem) {
          // Update existing item
          const tableName = type === 'service' ? 'ppob_services' : type === 'product' ? 'ppob_products' : 'digiflazz_config';
          const idField = type === 'digiflazz' ? 'user_id' : 'id';
          const idValue = type === 'digiflazz' ? null : selectedItem.id;
          const { error } = await supabase.from(tableName).update(data).eq(idField, idValue);
          if (error) throw error;
          alert(`${type.charAt(0).toUpperCase() + type.slice(1)} berhasil diperbarui.`);
        } else {
          // Add new item
          const tableName = type === 'service' ? 'ppob_services' : type === 'product' ? 'ppob_products' : 'digiflazz_config';
          if (type === 'digiflazz') {
            data.user_id = null; // Set the user_id for digiflazz_config
          }
          const { error } = await supabase.from(tableName).insert([data]);
          if (error) throw error;
          alert(`${type.charAt(0).toUpperCase() + type.slice(1)} berhasil ditambahkan.`);
        }
        // Refresh data
        if (type === 'service') fetchServices();
        else if (type === 'product') fetchProducts();
        else loadDigiflazzConfig();
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      alert(`Gagal menyimpan ${type}.`);
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const handleTestPurchase = async () => {
    if (!selectedService) {
      alert('Please select a service first');
      return;
    }
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    if (!customerNo.trim()) {
      alert('Please enter a customer number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Selected Product for Purchase:', selectedProduct); // Log the selected product value
      const username = digiflazzConfig?.username || '';
      const apiKey = digiflazzConfig?.api_key || '';
      const refId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const signRaw = `${username}${apiKey}${refId}`;
      const signature = CryptoJS.MD5(signRaw).toString();
      const buyerSkuCode = typeof selectedProduct === 'string' ? selectedProduct : (selectedProduct as any).buyer_sku_code;
      const requestBody = {
        username,
        buyer_sku_code: buyerSkuCode || '',
        customer_no: customerNo,
        ref_id: refId,
        sign: signature,
      };
      console.log('Test Purchase Request Body:', requestBody); // Log request body for debugging
      const response = await fetch('/digiflazz-proxy/v1/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test purchase failed:', errorText);
        if (errorText.includes('IP tidak diizinkan')) {
          alert('Transaksi gagal: IP tidak diizinkan. Harap whitelist IP Anda di Digiflazz.');
        } else if (errorText.includes('Produk sedang Gangguan') || errorText.includes('Produk sedang tidak tersedia') || errorText.includes('Non Aktif')) {
          alert('Transaksi gagal: Produk sedang tidak tersedia atau non-aktif. Silakan coba produk lain.');
        } else {
          alert(`Test purchase failed: ${errorText}`);
        }
      } else {
        const data = await response.json();
        console.log('Test Purchase Response:', data);
        alert(`Pembelian berhasil!: ${JSON.stringify(data)}`);
        
        // Save transaction data to Supabase with correct ref_id
        await saveTransactionToSupabase({
          ...data.data,
          ref_id: refId  // Ensure our generated ref_id is used
        });
        
        setCustomerNo('');
      }
    } catch (error) {
      console.error('Error during test purchase:', error);
      alert('An error occurred during test purchase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    setIsLoading(true);
    try {
      const signRaw = `${digiflazzConfig.username}${digiflazzConfig.api_key}depo`;
      const sign = CryptoJS.MD5(signRaw).toString();

      const response = await fetch('/digiflazz-proxy/v1/cek-saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: digiflazzConfig.username,
          sign: sign
        })
      });

      const responseText = await response.text();
      console.log('Balance Check Response:', response.status, responseText);

      if (!response.ok) {
        if (responseText.includes('IP Anda tidak kami kenali')) {
          throw new Error('IP Anda tidak dikenali oleh Digiflazz. Harap whitelist IP Anda di pengaturan Digiflazz.');
        }
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (data && data.data) {
        alert(`Saldo Digiflazz: Rp ${data.data.deposit.toLocaleString('id-ID')}`);
      } else {
        alert('Gagal memeriksa saldo. Tidak ada data yang dikembalikan.');
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      alert(`Gagal memeriksa saldo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      alert('Transaksi berhasil dihapus dari database.');
      fetchSupabaseTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Gagal menghapus transaksi dari database.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTransaction = async (transactionId: string, updatedData: any) => {
    try {
      const { data, error } = await supabase
        .from('transaksi_digiflazz')
        .update(updatedData)
        .eq('id', transactionId)
        .select();

      if (error) throw error;
      alert('Transaksi berhasil diperbarui di database.');
      fetchSupabaseTransactions(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Gagal memperbarui transaksi di database.');
      return null;
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedItem(transaction);
    setCurrentFormType('transaction');
    setIsDialogOpen(true);
  };

  const handleCheckPlnId = async () => {
    if (!customerNo) {
      alert('Silakan masukkan nomor pelanggan PLN terlebih dahulu.');
      return;
    }

    setIsValidatingPln(true);
    try {
      const signRaw = `${digiflazzConfig.username}${digiflazzConfig.api_key}${customerNo}`;
      const sign = CryptoJS.MD5(signRaw).toString();

      const response = await fetch('/digiflazz-proxy/v1/inquiry-pln', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: digiflazzConfig.username,
          customer_no: customerNo,
          sign: sign
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PLN ID Validation Error:', response.status, errorText);
        setPlnValidationResult({ status: 'Gagal', message: `HTTP error! Status: ${response.status}`, details: errorText });
        alert(`Validasi gagal! Status: ${response.status}. Detail: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const data = await response.json();
      if (data && data.data) {
        setPlnValidationResult(data.data);
        console.log('PLN Validation Full Response:', data);
        alert(`Status validasi: ${data.data.status}, Nama: ${data.data.name || 'N/A'}, No. Pelanggan: ${data.data.customer_no || 'N/A'}, No. Meter: ${data.data.meter_no || 'N/A'}, ID Pelanggan: ${data.data.subscriber_id || 'N/A'}, Daya: ${data.data.segment_power || 'N/A'}`);
      } else {
        setPlnValidationResult({ status: 'Gagal', message: 'Tidak ada data yang dikembalikan dari Digiflazz API.' });
        alert('Validasi gagal. Tidak ada data yang dikembalikan.');
      }
    } catch (error) {
      console.error('Error validating PLN ID:', error);
      setPlnValidationResult({ status: 'Gagal', message: error.message });
      alert('Gagal memvalidasi nomor pelanggan PLN.');
    } finally {
      setIsValidatingPln(false);
    }
  };

  const WebhookManagementTab = () => {
    const [webhookUrl, setWebhookUrl] = useState<string>("");
    const [testResult, setTestResult] = useState<string>("");
    const [isTesting, setIsTesting] = useState<boolean>(false);

    const handleTestWebhook = async () => {
      setIsTesting(true);
      setTestResult("");
      try {
        // Use local proxy endpoint to avoid CORS issue
        if (!digiflazzConfig) {
          throw new Error("Digiflazz configuration not loaded");
        }
        
        // Prompt user for webhook ID if not already set
        let webhookId = webhookUrl.split('/').pop(); // Try to extract from URL if possible
        if (!webhookId || webhookId.length < 5) {
          webhookId = prompt("Please enter your Digiflazz Webhook ID (from Atur Koneksi > API > Webhook):") || "";
        }
        
        if (!webhookId) {
          throw new Error("Webhook ID is required for testing");
        }
        
        // Generate a test reference ID
        const testRefId = `TEST-${Date.now()}`;
        
        // Create a signature for the request (based on Digiflazz requirements)
        const rawSign = `${digiflazzConfig.username}${digiflazzConfig.api_key}${testRefId}`;
        const signature = CryptoJS.MD5(rawSign).toString();
        
        // Send request to local proxy API endpoint which will forward to Digiflazz ping endpoint
        const response = await fetch('/api/test-webhook-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: digiflazzConfig.username,
            ref_id: testRefId,
            sign: signature,
            webhook_url: webhookUrl,
            webhook_id: webhookId,
            use_ping_endpoint: true
          }),
        });
        
        // Check if response has content before attempting to parse as JSON
        const text = await response.text();
        let data;
        try {
          data = text ? JSON.parse(text) : { message: 'No response content from proxy' };
        } catch (e) {
          data = { error: 'Invalid JSON response from proxy', rawResponse: text };
        }
        
        if (response.ok) {
          setTestResult(`Webhook test successful: ${JSON.stringify(data)}`);
        } else {
          setTestResult(`Webhook test failed: ${data.error || response.statusText}`);
        }
      } catch (error: any) {
        setTestResult(`Error testing webhook: ${error.message}`);
      } finally {
        setIsTesting(false);
      }
    };

    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Webhook Management</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Webhook URL</label>
            <input
              type="text"
              id="webhookUrl"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter your webhook URL"
            />
          </div>
          <button
            onClick={handleTestWebhook}
            disabled={isTesting || !webhookUrl}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isTesting ? "Testing..." : "Test Webhook"}
          </button>
          {testResult && (
            <div className="mt-4 p-3 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-700">{testResult}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const toastDuration = 5000;
  const toastPosition = "top-right" as const;

  const fetchServices = async () => {
    // Implementation for fetching services
    console.log("Fetching services");
  };

  const fetchProducts = async () => {
    // Implementation for fetching products
    console.log("Fetching products");
  };

  const loadDigiflazzConfig = async () => {
    // Implementation for loading Digiflazz config
    console.log("Loading Digiflazz config");
  };

  interface PPOBTransaction {
    id: string;
    updated_at: string;
    ref_id: string;
    status: string;
    amount: number;
    fee: number;
    customer_no: string;
    product_code: string;
    message: string | null;
    serial_no: string | null;
    buyer_last_saldo: number | null;
    tele: string | null;
    wa: string | null;
    customer_name: string;
    product_name: string;
    transaction_date?: string;
    customer_id?: string;
  }

  const TransactionsTab = () => {
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Riwayat Transaksi</h3>
        {/* Only showing Supabase transaction history */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Riwayat Transaksi dari Database Supabase</h4>
          {isLoadingTransactions ? (
            <div className="text-center py-10">Memuat data transaksi...</div>
          ) : supabaseTransactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Tidak ada data transaksi di database Supabase</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Pelanggan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode SKU Pembeli</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Terakhir Pembeli</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tele</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Update</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supabaseTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.ref_id || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.customer_no || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.buyer_sku_code || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.status || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transaction.message || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.rc || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.sn || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.price ? 'Rp ' + transaction.price.toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.buyer_last_saldo ? 'Rp ' + transaction.buyer_last_saldo.toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.tele || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.wa || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.updated_at ? new Date(transaction.updated_at).toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin PPOB - JPC Digi</title>
        <meta name="description" content="Panel admin untuk pengelolaan layanan PPOB JPC Digi" />
      </Helmet>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin PPOB</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Icons.download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={() => handleAdd(activeTab === 'services' ? 'service' : 'product')}>
              <Icons.plus className="mr-2 h-4 w-4" />
              Tambah {activeTab === 'services' ? 'Layanan' : 'Produk'}
            </Button>
            <Button 
              onClick={handleCheckBalance} 
              disabled={isLoading || !digiflazzConfig}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Memeriksa...' : 'Cek Saldo Digiflazz'}
            </Button>
            <Button 
              onClick={handleTestPurchase} 
              disabled={isLoading || !digiflazzConfig || !selectedService || !selectedProduct || !customerNo}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Membeli...' : 'Tes Pembelian'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="services">Layanan</TabsTrigger>
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="digiflazz">Digiflazz API</TabsTrigger>
            <TabsTrigger value="test-purchase">Tes Pembelian</TabsTrigger>
            <TabsTrigger value="webhook">Webhook Management</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* dashboardStats */}
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>
                  Daftar 5 transaksi terbaru di sistem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-8 flex justify-center">Memuat data...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 5).map((transaction) => (
                        <TableRow key={transaction.id || 'temp-' + Math.random().toString()}>
                          <TableCell className="font-medium">{transaction.id || 'N/A'}</TableCell>
                          <TableCell>{transaction.customer_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.product_name || 'N/A'}</TableCell>
                          <TableCell>Rp {transaction.amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'Sukses' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'Gagal' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status || 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* User Verifications - Static for now */}
            <Card>
              <CardHeader>
                <CardTitle>Verifikasi Pengguna Terbaru</CardTitle>
                <CardDescription>
                  Permintaan verifikasi pengguna yang membutuhkan review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Dokumen</TableHead>
                      <TableHead>Tanggal Pengajuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* dashboardStats */}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <TransactionsTab />
          </TabsContent>
          
          {/* Digiflazz API Tab */}
          <TabsContent value="digiflazz" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Konfigurasi Digiflazz API</CardTitle>
                <CardDescription>Atur kredensial API Digiflazz untuk integrasi PPOB</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {digiflazzConfig ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-md p-4">
                          <p className="text-sm text-muted-foreground">Username</p>
                          <p className="font-medium">{digiflazzConfig.username}</p>
                        </div>
                        <div className="border rounded-md p-4">
                          <p className="text-sm text-muted-foreground">API Key</p>
                          <p className="font-medium">{digiflazzConfig.api_key ? digiflazzConfig.api_key.slice(0, 4) + '****' : 'Not set'}</p>
                        </div>
                        <div className="border rounded-md p-4">
                          <p className="text-sm text-muted-foreground">Mode</p>
                          <p className="font-medium">{digiflazzConfig.mode}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">Konfigurasi Digiflazz belum diatur. Klik tombol di bawah untuk menambahkan konfigurasi.</p>
                    )}
                    <Button onClick={() => handleEdit(digiflazzConfig || {})}>
                      {digiflazzConfig ? 'Edit Konfigurasi' : 'Tambah Konfigurasi'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produk PPOB</CardTitle>
                <CardDescription>Daftar produk PPOB dari database dan API Digiflazz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={() => handleAdd('product')}>Tambah Produk</Button>
                </div>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">Produk Database</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Deskripsi</TableHead>
                          <TableHead>Layanan</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>Rp {product.price?.toLocaleString()}</TableCell>
                            <TableCell>{product.description || '-'}</TableCell>
                            <TableCell>{product.service_id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(product)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(product)}
                                  disabled={isDeleting}
                                >
                                  Hapus
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {digiflazzConfig && digiflazzConfig.api_key && (
                      <>
                        <h3 className="text-lg font-medium mt-6 mb-2">Produk dari Digiflazz API</h3>
                        {digiflazzProducts.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {digiflazzProducts.map((product) => (
                                <TableRow key={product.product_id || product.buyer_sku_code}>
                                  <TableCell className="font-medium">{product.product_name}</TableCell>
                                  <TableCell>Rp {product.price?.toLocaleString()}</TableCell>
                                  <TableCell>{product.category}</TableCell>
                                  <TableCell>{product.brand}</TableCell>
                                  <TableCell>{product.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-muted-foreground">Tidak ada data produk dari Digiflazz API.</p>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Layanan</CardTitle>
                <CardDescription>
                  Kelola layanan PPOB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <Input placeholder="Cari nama layanan..." className="max-w-sm" />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="topup">Top Up</SelectItem>
                        <SelectItem value="tagihan">Tagihan</SelectItem>
                        <SelectItem value="investasi">Investasi</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline">
                    <Icons.filterX className="mr-2 h-4 w-4" />
                    Reset Filter
                  </Button>
                </div>

                {/* Services Table */}
                {isLoading ? (
                  <div className="py-8 flex justify-center">Memuat data...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nama Layanan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id || 'temp-' + Math.random().toString()}>
                          <TableCell className="font-medium">{service.id || 'N/A'}</TableCell>
                          <TableCell>{service.name || 'N/A'}</TableCell>
                          <TableCell>{service.category || 'N/A'}</TableCell>
                          <TableCell>{service.route || 'N/A'}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Aktif
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500" disabled={isDeleting} onClick={() => handleDelete(service)}>
                                Nonaktifkan
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Purchase Tab */}
          <TabsContent value="test-purchase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tes Pembelian Produk Digiflazz</CardTitle>
                <CardDescription>Form untuk menguji pembelian produk seperti cek nama token, dll.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="service-select" className="block text-sm font-medium mb-1">Layanan</label>
                    <Select defaultValue={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger id="service-select" className="w-full rounded-md border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Pilih Layanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {digiflazzCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedService && (
                    <div>
                      <label htmlFor="product-select" className="block text-sm font-medium mb-1">Produk (SKU)</label>
                      <Select defaultValue={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger id="product-select" className="w-full rounded-md border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Pilih Produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            // Filter products based on the selected Digiflazz category
                            const filteredProducts = digiflazzProducts.filter(product => {
                              console.log('Filtering products for category:', selectedService);
                              console.log('Product details:', product);
                              return product.category === selectedService;
                            });

                            // If no products match, show a message
                            if (filteredProducts.length === 0) {
                              return <div className="p-2 text-gray-500">Tidak ada produk yang sesuai dengan layanan {selectedService}.</div>;
                            }

                            // Show matched products
                            return filteredProducts.map(product => (
                              <SelectItem key={product.buyer_sku_code} value={product.buyer_sku_code}>{product.product_name}</SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">Produk difilter berdasarkan kategori Digiflazz.</p>
                    </div>
                  )}
                  {selectedService && (
                    <div>
                      <label htmlFor="customerNo" className="block text-sm font-medium mb-1">Nomor Pelanggan</label>
                      <div className="flex space-x-2 mt-1">
                        <input
                          type="text"
                          id="customerNo"
                          value={customerNo}
                          onChange={(e) => setCustomerNo(e.target.value)}
                          placeholder="Masukkan nomor pelanggan"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={handleCheckPlnId}
                          disabled={isValidatingPln || !customerNo}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isValidatingPln ? 'Memvalidasi...' : 'Cek ID PLN'}
                        </button>
                      </div>
                      {plnValidationResult && (
                        <div className="mt-2 p-3 border border-green-300 bg-green-50 rounded-md text-sm">
                          <p className="font-medium text-green-800">Hasil Validasi ID PLN:</p>
                          <ul className="list-disc list-inside text-green-700 mt-1">
                            <li>Status: {plnValidationResult.status}</li>
                            <li>Nama: {plnValidationResult.name || 'N/A'}</li>
                            <li>No. Pelanggan: {plnValidationResult.customer_no}</li>
                            <li>No. Meter: {plnValidationResult.meter_no || 'N/A'}</li>
                            <li>ID Pelanggan: {plnValidationResult.subscriber_id || 'N/A'}</li>
                            <li>Daya: {plnValidationResult.segment_power || 'N/A'}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Button 
                      onClick={handleTestPurchase} 
                      disabled={isLoading || !selectedService || !selectedProduct || !customerNo}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading ? 'Loading...' : 'Test Pembelian'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Management Tab */}
          <TabsContent value="webhook" className="space-y-4">
            <WebhookManagementTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <AdminDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        formType={currentFormType} 
        selectedItem={selectedItem} 
        onSave={handleSaveItem} 
      />
    </AdminLayout>
  );
}
