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
import { RefreshCw, Loader } from "lucide-react";
import { digiflazzService } from '@/services/digiflazz';

export default function PPOBAdminPage() {
  // Function to check pending transactions
  const checkPendingTransactions = async () => {
    try {
      console.log(`
      ==============================================================
      🔄 Cron Job Started at ${new Date().toISOString()}
      ==============================================================
      `);
      
      // Get pending transactions from Supabase
      const { data: pendingTx, error: fetchError } = await supabase
        .from('transaksi_digiflazz')
        .select('*')
        .in('status', ['Pending', 'pending'])
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error(`❌ Error fetching pending transactions: ${fetchError.message}`);
        console.error('❌ Detailed error:', fetchError.details);
        toast.error('Error fetching pending transactions', { duration: 5000 });
        return;
      }

      if (!pendingTx || pendingTx.length === 0) {
        console.log(`✅ No pending transactions found`);
        console.log(`=============================================================
        🔄 Cron Job Completed at ${new Date().toISOString()}
        ==============================================================
        `);
        return;
      }

      console.log(`🔍 Found ${pendingTx.length} pending transactions to check`);
      console.log('🔍 List of pending transactions:');
      pendingTx.forEach(tx => {
        console.log(`  - ref_id: ${tx.ref_id}
    - customer_no: ${tx.customer_no}
    - buyer_sku_code: ${tx.buyer_sku_code}
    - current status: ${tx.status}
    - last updated: ${tx.updated_at}`);
      });
      
      // Process each pending transaction
      for (const tx of pendingTx) {
        try {
          console.log(`\n----------------------------------------
          🔄 Checking transaction ${tx.ref_id}...
          ----------------------------------------`);
          console.log('🔍 Transaction details:', {
            ref_id: tx.ref_id,
            customer_no: tx.customer_no,
            buyer_sku_code: tx.buyer_sku_code,
            current_status: tx.status
          });
          
          // Generate signature with ref_id
          const sign = CryptoJS.MD5(
            `${digiflazzConfig?.username}${digiflazzConfig?.api_key}${tx.ref_id}`
          ).toString();

          // Check transaction status with Digiflazz
          console.log('🚀 Sending request to Digiflazz API...');
          const response = await fetch('/digiflazz-proxy/v1/transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: digiflazzConfig?.username || '',
              ref_id: tx.ref_id,
              sign: sign,
              cmd: 'status', // Change to 'status' as per API requirement
              buyer_sku_code: tx.buyer_sku_code // Add buyer_sku_code
            })
          });

          // Get response text first to handle non-JSON responses
          const responseText = await response.text();
          console.log('📊 Raw response:', responseText);

          // Try to parse as JSON
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.error('❌ Error parsing response:', parseError);
            console.error('📋 Raw response:', responseText);
            throw new Error(`Failed to parse response as JSON: ${parseError.message}`);
          }

          console.log('📊 Parsed response:', JSON.stringify(result, null, 2));
          
          if (result.data && result.data.status) {
            const newStatus = result.data.status;
            console.log(`✅ Status updated to ${newStatus} for ref_id: ${tx.ref_id}`);
            console.log('✅ Status change details:', {
              ref_id: tx.ref_id,
              old_status: tx.status,
              new_status: newStatus,
              message: result.data.message,
              rc: result.data.rc,
              sn: result.data.sn
            });
            
            // Update transaction in Supabase
            console.log('💾 Updating transaction in Supabase...');
            const updateResult = await supabase
              .from('transaksi_digiflazz')
              .update({
                status: newStatus,
                message: result.data.message,
                rc: result.data.rc,
                sn: result.data.sn,
                buyer_last_saldo: result.data.buyer_last_saldo,
                tele: result.data.tele,
                wa: result.data.wa,
                updated_at: new Date().toISOString()
              })
              .eq('ref_id', tx.ref_id);

            if (updateResult.error) {
              console.error(`❌ Error updating transaction ${tx.ref_id}: ${updateResult.error.message}`);
              console.error('❌ Detailed error:', updateResult.error.details);
              toast.error(`Error updating transaction ${tx.ref_id}`, { duration: 5000 });
              continue;
            }
            console.log('✅ Transaction updated in Supabase');

            // Update local state
            console.log('🔄 Updating local state...');
            setTransactions(prev => 
              prev.map(t => 
                t.ref_id === tx.ref_id 
                  ? { ...t, ...result.data, updated_at: new Date().toISOString() } 
                  : t
              )
            );

            // Show success toast for completed transactions
            if (newStatus === 'Berhasil') {
              console.log('🎉 Transaction completed successfully!');
              toast.success(`Transaction ${tx.ref_id} completed successfully!`, { duration: 5000 });
            } else if (newStatus === 'Gagal') {
              console.log('❌ Transaction failed');
              toast.error(`Transaction ${tx.ref_id} failed: ${result.data.message}`, { duration: 5000 });
            }
          } else {
            console.log(`🔍 Transaction ${tx.ref_id} status unchanged: ${tx.status}`);
          }
        } catch (err) {
          console.error(`❌ Error checking transaction ${tx.ref_id}:`, err);
          console.error('❌ Error details:', {
            message: err.message,
            stack: err.stack
          });
          toast.error(`Error checking transaction ${tx.ref_id}: ${err.message}`, { duration: 5000 });
        }
      }

      console.log(`\n=============================================================
      🔄 Cron Job Completed at ${new Date().toISOString()}
      ==============================================================
      `);
    } catch (err) {
      console.error('❌ Error in checkPendingTransactions:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      toast.error('Error in transaction status check', { duration: 5000 });
    }
  };

  // Function to check Digiflazz balance
  const checkBalance = async () => {
    try {
      const response = await fetch('/api/digiflazz-proxy/v1/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cmd: 'balance'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from proxy:', errorText);
        throw new Error(`Proxy error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && result.data.status === 'Berhasil') {
        console.log('Saldo Digiflazz:', result.data);
        setDigiflazzBalance(result.data);
        // Show toast only if balance changes
        if (!digiflazzBalance || digiflazzBalance.saldo !== result.data.saldo) {
          toast.success(`Saldo diperbarui: Rp${result.data.saldo}`, { duration: 5000 });
        }
      } else {
        console.error('Invalid response format:', result);
        setDigiflazzBalance(null);
        toast.error('Failed to get balance information', { duration: 5000 });
        console.error('Gagal memeriksa saldo:', result);
        setDigiflazzBalance(null);
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      setDigiflazzBalance(null);
      toast.error(`Gagal memeriksa saldo: ${error.message}. Pastikan IP Anda terdaftar di whitelist Digiflazz dan kredensial API valid.`, { duration: 7000 });
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchDigiflazzCategories();
    checkPendingTransactions();
    checkBalance(); // Check balance immediately

    // Schedule to run every minute
    const interval = setInterval(() => {
      checkPendingTransactions();
      checkBalance(); // Check balance periodically
    }, 60000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<PPOBService[]>([]);
  const [products, setProducts] = useState<PPOBProduct[]>([]);
  const [digiflazzProducts, setDigiflazzProducts] = useState<any[]>([]);
  const [digiflazzCategories, setDigiflazzCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<PPOBTransaction[]>([]);
  const [digiflazzTransactions, setDigiflazzTransactions] = useState<any[]>([]);
  const [digiflazzServices, setDigiflazzServices] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Function to fetch Digiflazz categories
  const fetchDigiflazzCategories = async () => {
    try {
      if (!digiflazzConfig) {
        console.error('No Digiflazz credentials available');
        setDigiflazzCategories([]);
        return;
      }

      const response = await fetch('/api/digiflazz-proxy/v1/service-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: digiflazzConfig.username,
          apiKey: digiflazzConfig.api_key,
          cmd: 'category-list'
        })
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error fetching Digiflazz categories:', errorResponse);
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorResponse.details}`);
      }

      const result = await response.json();
      console.log('Category list response:', result);
      
      // Handle different possible response formats
      let categories = [];
      if (result.data && result.data.categories && Array.isArray(result.data.categories)) {
        categories = result.data.categories;
      } else if (result.data && Array.isArray(result.data)) {
        categories = result.data;
      }
      
      if (categories.length > 0) {
        console.log('Digiflazz categories fetched successfully:', categories);
        setDigiflazzCategories(categories);
      } else {
        console.error('No services found in response:', result);
        setDigiflazzServices([]);
        console.error('Invalid response format for services:', result);
        setDigiflazzServices([]);
      }
    } catch (error) {
      console.error('Error fetching Digiflazz services:', error);
      setDigiflazzServices([]);
    }
  };
  const [supabaseTransactions, setSupabaseTransactions] = useState<any[]>([]);
  const [digiflazzConfig, setDigiflazzConfig] = useState<any>(null);
  const [digiflazzBalance, setDigiflazzBalance] = useState<any>(null);
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
          description: `Transaksi baru dengan ID ${payload.new.ref_id} telah diterima.`,
          duration: 5000
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
      const signRaw = `${digiflazzConfig.username}${digiflazzConfig.api_key}`;
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
      toast.error('Gagal memuat transaksi dari Supabase', { duration: 5000 });
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
      toast.success('Transaksi berhasil disimpan ke Supabase', { duration: 5000 });
    } catch (err: any) {
      console.error('Error saving transaction to Supabase:', err);
      toast.error('Gagal menyimpan transaksi ke Supabase', { duration: 5000 });
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
      const refId = `JPC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
      setDigiflazzBalance(null);
      toast.error(`Gagal memeriksa saldo: ${error.message}. Pastikan IP Anda terdaftar di whitelist Digiflazz dan kredensial API valid.`, { duration: 7000 });
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
    setPlnValidationResult(null);

    try {
      const sign = CryptoJS.MD5(
        `${digiflazzConfig.username}${digiflazzConfig.api_key}${customerNo}`
      ).toString();

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
      
      if (data.data && data.data.status === 'Berhasil') {
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

  const handleSyncProducts = async () => {
    setIsSyncing(true);
    try {
      const response = await digiflazzService.syncProducts();
      if (response.success) {
        toast.success(`Berhasil menyinkronkan ${response.data.count} produk ke database`);
        fetchProducts();
      } else {
        toast.error('Gagal menyinkronkan produk. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast.error(`Error: ${error.message || 'Terjadi kesalahan saat menyinkronkan produk'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProductsToDatabase = async () => {
    if (!digiflazzProducts || digiflazzProducts.length === 0) {
      toast.error("No Digiflazz products to save.");
      return;
    }

    try {
      // Transform the data to match the column names in the database
      const transformedProducts = digiflazzProducts.map(product => ({
        product_name: product.product_name,
        category: product.category,
        brand: product.brand,
        type: product.type,
        seller_name: product.seller_name,
        price: product.price,
        harga_jual: product.harga_jual || product.price,
        buyer_sku_code: product.buyer_sku_code,
        buyer_product_status: product.buyer_product_status,
        seller_product_status: product.seller_product_status,
        unlimited_stock: product.unlimited_stock,
        stock: product.stock,
        multi: product.multi,
        start_cut_off: product.start_cut_off,
        end_cut_off: product.end_cut_off,
        product_desc: product.desc || product.description || ''
      }));

      const { data, error } = await supabase
        .from('digiflazz_products')
        .upsert(transformedProducts, { onConflict: 'buyer_sku_code' });

      if (error) throw error;
      toast.success("Digiflazz products saved to database successfully.");
    } catch (error: any) {
      toast.error(`Error saving products: ${error.message || 'Unknown error'}. Table 'digiflazz_products' might not exist in Supabase or there is a column mismatch. Please check the table schema.`, { duration: 10000 });
      console.error("Error saving products to database:", error);
    }
  };

  const [hargaJualMethod, setHargaJualMethod] = useState<'percentage' | 'fixed'>('percentage');
  const [hargaJualValue, setHargaJualValue] = useState<number>(10); // Default 10% or 10 nominal

  const handleUpdateHargaJual = () => {
    if (!digiflazzProducts || digiflazzProducts.length === 0) {
      toast.error("No Digiflazz products to update.");
      return;
    }

    const updatedProducts = digiflazzProducts.map(product => {
      let newHargaJual = product.price;
      if (hargaJualMethod === 'percentage') {
        newHargaJual = product.price * (1 + hargaJualValue / 100);
      } else {
        newHargaJual = product.price + hargaJualValue;
      }
      return { ...product, harga_jual: Math.round(newHargaJual) };
    });

    setDigiflazzProducts(updatedProducts);
    toast.success("Harga jual updated for all products.");
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
            <label htmlFor="webhookUrl" className="block text-sm font-medium mb-1">Webhook URL</label>
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

  const EmoneyValidationTab = () => {
    const [emoneyNumber, setEmoneyNumber] = useState('');
    const [validationResult, setValidationResult] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const validateEmoneyUser = async () => {
      if (!emoneyNumber) {
        toast.error('Please enter an e-money number', { duration: 5000 });
        return;
      }

      if (!digiflazzConfig) {
        toast.error('Digiflazz configuration not loaded', { duration: 5000 });
        return;
      }

      setIsChecking(true);
      setValidationResult(null);

      try {
        const sign = CryptoJS.MD5(
          `${digiflazzConfig.username}${digiflazzConfig.api_key}${emoneyNumber}`
        ).toString();

        const response = await fetch('/digiflazz-proxy/v1/transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: digiflazzConfig.username,
            customer_no: emoneyNumber,
            sign: sign
          })
        });

        const data = await response.json();
        
        if (data.data && data.data.status === 'Berhasil') {
          setValidationResult(data.data);
          console.log('E-money validation full response:', data);
          toast.success('E-money validation successful', { duration: 5000 });
        } else {
          toast.error(data.data?.message || 'Failed to validate e-money user', { duration: 5000 });
        }
      } catch (error) {
        console.error('Error validating e-money user:', error);
        toast.error('Error validating e-money user', { duration: 5000 });
      } finally {
        setIsChecking(false);
      }
    };

    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Validasi Pengguna E-money/E-wallet</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label htmlFor="emoneyNumber" className="block text-sm font-medium mb-1">Nomor E-money/E-wallet</label>
              <input
                type="text"
                id="emoneyNumber"
                value={emoneyNumber}
                onChange={(e) => setEmoneyNumber(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                placeholder="Enter e-money number"
              />
            </div>
            <button
              onClick={validateEmoneyUser}
              disabled={isChecking}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isChecking ? "Checking..." : "Validate User"}
            </button>
            {validationResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Validation Result</h4>
                <p className="text-sm text-gray-700">Status: {validationResult.status}</p>
                <p className="text-sm text-gray-700">Name: {validationResult.name || 'N/A'}</p>
                <p className="text-sm text-gray-700">Phone: {validationResult.phone || 'N/A'}</p>
                <p className="text-sm text-gray-700">Message: {validationResult.message || 'N/A'}</p>
              </div>
            )}
          </div>
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
                    <tr key={transaction.ref_id}>
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

  const [databaseProducts, setDatabaseProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [hargaJualMethodProduk, setHargaJualMethodProduk] = useState<'percentage' | 'fixed'>('percentage');
  const [hargaJualValueProduk, setHargaJualValueProduk] = useState<number>(10); // Default 10% or 10 nominal

  const fetchDatabaseProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('digiflazz_products')
        .select('*')
        .order('product_name', { ascending: true });

      if (error) {
        console.error("Supabase error details:", error);
        if (error.code === 'PGRST116') {
          toast("Table 'digiflazz_products' does not exist in Supabase. Please create the table using the provided SQL script.", { icon: 'ℹ️', duration: 10000 });
        } else {
          toast(`Error fetching products: ${error.message || 'Unknown error'}. Table might not exist or no data available.`, { duration: 8000 });
        }
        throw error;
      }
      console.log("Fetched products from database:", data?.length || 0, "items");
      setDatabaseProducts(data || []);
      if (data && data.length === 0) {
        toast("No products found in database. Please go to Digiflazz API tab and click 'Save Products to Database' to populate the table.", { icon: 'ℹ️', duration: 10000 });
      }
    } catch (error: any) {
      console.error("Error fetching products from database:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleUpdateHargaJualProduk = () => {
    if (databaseProducts.length === 0) {
      toast.error("No products to update.");
      return;
    }

    const updatedProducts = databaseProducts.map(product => {
      let newHargaJual = product.price;
      if (hargaJualMethodProduk === 'percentage') {
        newHargaJual = product.price * (1 + hargaJualValueProduk / 100);
      } else {
        newHargaJual = product.price + hargaJualValueProduk;
      }
      return { ...product, harga_jual: Math.round(newHargaJual) };
    });

    setDatabaseProducts(updatedProducts);
    toast.success("Harga jual berhasil diperbarui untuk semua produk di tabel.");
  };

  const handleSaveHargaJualToDatabase = async () => {
    if (databaseProducts.length === 0) {
      toast.error("No products to save to database.");
      return;
    }

    try {
      // Ensure all required fields are included, especially those with NOT NULL constraints
      const updates = databaseProducts.map(product => ({
        product_name: product.product_name,
        category: product.category,
        brand: product.brand,
        type: product.type,
        seller_name: product.seller_name,
        price: product.price,
        harga_jual: product.harga_jual,
        buyer_sku_code: product.buyer_sku_code,
        buyer_product_status: product.buyer_product_status,
        seller_product_status: product.seller_product_status,
        unlimited_stock: product.unlimited_stock,
        stock: product.stock,
        multi: product.multi,
        start_cut_off: product.start_cut_off,
        end_cut_off: product.end_cut_off,
        product_desc: product.product_desc || ''
      }));

      const { data, error } = await supabase
        .from('digiflazz_products')
        .upsert(updates, { onConflict: 'buyer_sku_code' });

      if (error) throw error;
      toast.success("Harga jual saved to database successfully.");
    } catch (error: any) {
      toast.error(`Error saving harga_jual to database: ${error.message || 'Unknown error'}.`, { duration: 8000 });
      console.error("Error saving harga_jual to database:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'produk') {
      fetchDatabaseProducts();
    }
  }, [activeTab]);

  const ProdukTab = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Produk Digiflazz</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Atur Harga Jual</h3>
          <div className="flex gap-4 items-center">
            <select
              value={hargaJualMethodProduk}
              onChange={(e) => setHargaJualMethodProduk(e.target.value as 'percentage' | 'fixed')}
              className="border p-2 rounded w-32"
            >
              <option value="percentage">Persentase</option>
              <option value="fixed">Nominal Tetap</option>
            </select>
            <input
              type="number"
              value={hargaJualValueProduk}
              onChange={(e) => setHargaJualValueProduk(Number(e.target.value))}
              className="border p-2 rounded w-24"
              placeholder={hargaJualMethodProduk === 'percentage' ? '10%' : 'Rp 1000'}
              min="0"
            />
            <button
              onClick={handleUpdateHargaJualProduk}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Terapkan
            </button>
            <button
              onClick={handleSaveHargaJualToDatabase}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Simpan ke Database
            </button>
          </div>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Produk Database</h3>
          <button
            onClick={fetchDatabaseProducts}
            disabled={isLoadingProducts}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoadingProducts ? "Loading..." : "Refresh Produk"}
          </button>
        </div>
        
        {isLoadingProducts ? (
          <p className="text-muted-foreground">Loading products...</p>
        ) : databaseProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Jual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-gray divide-y divide-gray-200">
                {databaseProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.brand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {product.price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {product.harga_jual.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.buyer_sku_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unlimited_stock ? 'Unlimited' : product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No products found in database. Please sync products from Digiflazz API first.</p>
        )}
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
            {activeTab === 'digiflazz' && (
              <Button 
                size="sm" 
                onClick={handleSyncProducts} 
                disabled={isSyncing}
                className="flex items-center"
              >
                {isSyncing ? (
                  <>
                    <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                    Sinkronisasi...
                  </>
                ) : (
                  <>
                    <Icons.refreshCw className="mr-2 h-4 w-4" />
                    Update Produk
                  </>
                )}
              </Button>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Saldo Digiflazz</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {digiflazzBalance?.saldo ? `Rp${digiflazzBalance.saldo}` : 'Memuat...'}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Last Updated: {digiflazzBalance?.updated_at ? new Date(digiflazzBalance.updated_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCheckBalance} 
                disabled={isLoading || !digiflazzConfig}
                className="bg-green-600 hover:bg-green-700"
              >
                <Icons.refreshCw className="mr-2 h-4 w-4" />
                {isLoading ? 'Memuat...' : 'Perbarui'}
              </Button>
            </div>
            
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="services">Layanan</TabsTrigger>
      
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="digiflazz">Digiflazz API</TabsTrigger>
            <TabsTrigger value="test-purchase">Tes Pembelian</TabsTrigger>
            <TabsTrigger value="database-products">Manajemen Produk Database</TabsTrigger>
            
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

          {/* Digiflazz Categories Tab */}
          <TabsContent value="layanan-digiflazz" className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Kategori Layanan Digiflazz</h3>
              {isLoading ? (
                <div className="text-center py-10">Memuat data kategori...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {digiflazzCategories.map((category) => (
                        <tr key={category.category_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.name || category.category_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              category.status === 'active' ? 'bg-green-100 text-green-800' : 
                              category.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {category.status === 'active' ? 'Aktif' : 
                               category.status === 'inactive' ? 'Tidak Aktif' : 
                               'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Produk Digiflazz</CardTitle>
                <CardDescription>Daftar produk yang tersedia di Digiflazz</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Atur Harga Jual</h3>
                      <div className="flex gap-4 items-center">
                        <select
                          value={hargaJualMethod}
                          onChange={(e) => setHargaJualMethod(e.target.value as 'percentage' | 'fixed')}
                          className="border p-2 rounded w-32"
                        >
                          <option value="percentage">Persentase</option>
                          <option value="fixed">Nominal Tetap</option>
                        </select>
                        <input
                          type="number"
                          value={hargaJualValue}
                          onChange={(e) => setHargaJualValue(Number(e.target.value))}
                          className="border p-2 rounded w-24"
                          placeholder={hargaJualMethod === 'percentage' ? '10%' : 'Rp 1000'}
                          min="0"
                        />
                        <button
                          onClick={handleUpdateHargaJual}
                          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-4">
                      <Button
                        onClick={handleSyncProducts}
                        disabled={isSyncing}
                      >
                        {isSyncing ? "Syncing..." : "Sync Products from Digiflazz"}
                      </Button>
                      <Button
                        onClick={handleSaveProductsToDatabase}
                        variant="outline"
                      >
                        Save Products to Database
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Produk PPOB</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSyncProducts}
                    disabled={isSyncing || !digiflazzConfig}
                  >
                    {isSyncing ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sync Produk
                  </Button>
                  <Button onClick={() => handleAdd('product')}>Tambah Produk</Button>
                </div>
              </CardHeader>
              <CardContent>
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
                        {/* Hide Digiflazz API products in Produk tab as requested */}
                        {/* <h3 className="text-lg font-medium mt-6 mb-2">Produk dari Digiflazz API</h3>
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
                        ) */}
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
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

          {/* Produk Tab */}
          <TabsContent value="produk" className="space-y-4">
            <ProdukTab />
          </TabsContent>

          {/* Database Products Tab */}
          <TabsContent value="database-products" className="space-y-4">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Manajemen Produk Database</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Atur Harga Jual</h3>
                <div className="flex gap-4 items-center">
                  <select
                    value={hargaJualMethodProduk}
                    onChange={(e) => setHargaJualMethodProduk(e.target.value as 'percentage' | 'fixed')}
                    className="border p-2 rounded w-32"
                  >
                    <option value="percentage">Persentase</option>
                    <option value="fixed">Nominal Tetap</option>
                  </select>
                  <input
                    type="number"
                    value={hargaJualValueProduk}
                    onChange={(e) => setHargaJualValueProduk(Number(e.target.value))}
                    className="border p-2 rounded w-24"
                    placeholder={hargaJualMethodProduk === 'percentage' ? '10%' : 'Rp 1000'}
                    min="0"
                  />
                  <button
                    onClick={handleUpdateHargaJualProduk}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Terapkan
                  </button>
                  <button
                    onClick={handleSaveHargaJualToDatabase}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Simpan ke Database
                  </button>
                </div>
              </div>
              
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Produk Database</h3>
                <button
                  onClick={fetchDatabaseProducts}
                  disabled={isLoadingProducts}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoadingProducts ? "Loading..." : "Refresh Produk"}
                </button>
              </div>
              
              {isLoadingProducts ? (
                <p className="text-muted-foreground">Loading products...</p>
              ) : databaseProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Jual</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray divide-y divide-gray-200">
                      {databaseProducts.map((product, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.brand}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {product.price.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {product.harga_jual.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.buyer_sku_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.unlimited_stock ? 'Unlimited' : product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No products found in database. Please sync products from Digiflazz API first.</p>
              )}
            </div>
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
