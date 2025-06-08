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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { Icons } from "@/components/Icons";
import { supabase } from '../../integrations/supabase/client';
import { PPOBService, PPOBProduct, PPOBTransaction } from '../../integrations/supabase/ppob-types';
import { getPPOBServices, getPPOBProducts, getPPOBTransactions } from '../../services/ppobService';

export default function PPOBAdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<PPOBService[]>([]);
  const [products, setProducts] = useState<PPOBProduct[]>([]);
  const [digiflazzProducts, setDigiflazzProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<PPOBTransaction[]>([]);
  const [digiflazzConfig, setDigiflazzConfig] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PPOBService | PPOBProduct | null>(null);
  const [currentFormType, setCurrentFormType] = useState<'service' | 'product' | 'digiflazz'>('service');
  const [formData, setFormData] = useState({
    id: '', name: '', category: 'Top Up', icon: '', color: '', icon_color: '', route: '', is_new: false, price: 0, description: '', service_id: '',
    api_key: '', username: '', mode: 'development'
  });
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customerNo, setCustomerNo] = useState<string>('');

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
        const transactionsData = await supabase.from('ppob_transactions').select('*').order('created_at', { ascending: false });
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
    if (activeTab === 'products' && digiflazzConfig && digiflazzConfig.api_key && digiflazzConfig.username) {
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
              cmd: 'prepaid',
              username: digiflazzConfig.username,
              apiKey: digiflazzConfig.api_key
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.data) {
            setDigiflazzProducts(data.data);
          } else {
            console.error('No data returned from Digiflazz API');
            setDigiflazzProducts([]);
          }
        } catch (error) {
          console.error('Error fetching Digiflazz products:', error);
          setDigiflazzProducts([]);
          alert('Failed to fetch products from Digiflazz API');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchDigiflazzProducts();
    }
  }, [activeTab, digiflazzConfig]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 1500);
  };

  const handleAdd = (type: 'service' | 'product' | 'digiflazz') => {
    setFormData({ id: '', name: '', category: 'Top Up', icon: '', color: '', icon_color: '', route: '', is_new: false, price: 0, description: '', service_id: '', api_key: '', username: '', mode: 'development' });
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
      setFormData({
        id: service.id || '',
        name: service.name || '',
        category: service.category || 'Top Up',
        icon: service.icon || '',
        color: service.color || '',
        icon_color: service.icon_color || '',
        route: service.route || '',
        is_new: service.is_new || false,
        price: 0,
        description: '',
        service_id: '',
        api_key: '',
        username: '',
        mode: 'development'
      });
    } else if ('price' in item) {
      // It's a product
      const product = item as PPOBProduct;
      setCurrentFormType('product');
      setFormData({
        id: product.id || '',
        name: product.name || '',
        category: 'Top Up', // Default value since category doesn't exist on PPOBProduct
        icon: '',
        color: '',
        icon_color: '',
        route: '',
        is_new: false,
        price: product.price || 0,
        description: product.description || '',
        service_id: product.service_id || '',
        api_key: '',
        username: '',
        mode: 'development'
      });
    } else {
      // It's a Digiflazz config
      setCurrentFormType('digiflazz');
      setFormData({
        id: item.id || '',
        name: '',
        category: 'Top Up',
        icon: '',
        color: '',
        icon_color: '',
        route: '',
        is_new: false,
        price: 0,
        description: '',
        service_id: '',
        api_key: item.api_key || '',
        username: item.username || '',
        mode: item.mode || 'development'
      });
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (currentFormType === 'service') {
        const serviceData = {
          id: formData.id || undefined,
          name: formData.name,
          category: formData.category,
          icon: formData.icon,
          color: formData.color,
          icon_color: formData.icon_color,
          route: formData.route,
          is_new: formData.is_new
        };
        if (formData.id) {
          await supabase.from('ppob_services').update(serviceData).eq('id', formData.id);
          setServices(services.map(s => s.id === formData.id ? { ...s, ...serviceData } : s));
        } else {
          const { data } = await supabase.from('ppob_services').insert(serviceData).select().single();
          setServices([...services, data]);
        }
      } else if (currentFormType === 'product') {
        const productData = {
          id: formData.id || undefined,
          name: formData.name,
          price: formData.price,
          description: formData.description,
          service_id: formData.service_id
        };
        if (formData.id) {
          await supabase.from('ppob_products').update(productData).eq('id', formData.id);
          setProducts(products.map(p => p.id === formData.id ? { ...p, ...productData } : p));
        } else {
          const { data } = await supabase.from('ppob_products').insert(productData).select().single();
          setProducts([...products, data]);
        }
      } else if (currentFormType === 'digiflazz') {
        const configData = {
          id: formData.id || undefined,
          api_key: formData.api_key,
          username: formData.username,
          mode: formData.mode
        };
        if (formData.id) {
          await supabase.from('digiflazz_config').update(configData).eq('id', formData.id);
          setDigiflazzConfig({ ...digiflazzConfig, ...configData });
        } else {
          const { data } = await supabase.from('digiflazz_config').insert(configData).select().single();
          setDigiflazzConfig(data);
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(`Error saving data:`, error);
      alert(`Failed to save data`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Mock data for dashboard stats
  const dashboardStats = [
    { title: "Total Transaksi", value: transactions.length.toString(), change: "+12.5%", icon: <Icons.chartBar className="h-5 w-5" /> },
    { title: "Pendapatan", value: "Rp " + transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString(), change: "+8.2%", icon: <Icons.wallet className="h-5 w-5" /> },
    { title: "Pengguna Aktif", value: "5,890", change: "+15.3%", icon: <Icons.users className="h-5 w-5" /> },
    { title: "Produk Terjual", value: products.length.toString(), change: "+10.1%", icon: <Icons.shoppingCart className="h-5 w-5" /> },
  ];

  const handleTestPurchase = async () => {
    if (!selectedProduct || !customerNo) {
      alert('Mohon pilih produk dan masukkan nomor pelanggan.');
      return;
    }

    setIsLoading(true);
    try {
      const refId = `TEST_${Date.now()}`;
      const cmd = 'pay-pasca';
      // Generate signature for Digiflazz API with MD5 hashing
      // Using refId as the third parameter to match server-side implementation
      // Forced update for GitHub commit on 2025-06-08
      const signRaw = `${digiflazzConfig.username}${digiflazzConfig.api_key}${refId}`;
      // Creating MD5 hash for the signature
      const sign = await window.crypto.subtle.digest(
        'MD5',
        new TextEncoder().encode(signRaw)
      ).then(hash => {
        return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      });
      console.log('Test Purchase Request:', { sku: selectedProduct, customer_no: customerNo, ref_id: refId, sign });
      const response = await fetch('/digiflazz-proxy/v1/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: digiflazzConfig.username,
          apikey: digiflazzConfig.api_key,
          sku: selectedProduct,
          customer_no: customerNo,
          ref_id: refId,
          sign: sign,
          cmd: cmd
        })
        
      });

      const responseText = await response.text();
      console.log('Test Purchase Response:', response.status, responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (data && data.data) {
        alert(`Pembelian berhasil! Status: ${data.data.status}, SN: ${data.data.sn || 'N/A'}`);
      } else {
        alert('Pembelian gagal. Tidak ada data yang dikembalikan.');
      }
    } catch (error) {
      console.error('Error performing test purchase:', error);
      alert(`Gagal melakukan pembelian: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardStats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                        <p className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change} dari bulan lalu
                        </p>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-full">
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                    {[
                      { id: "V001", user: "Bambang Suprapto", document: "KTP", submissionDate: "2025-06-01 10:23:45", status: "Pending", action: "Review" },
                      { id: "V002", user: "Ratna Sari", document: "KTP", submissionDate: "2025-06-01 09:15:30", status: "Disetujui", action: "Lihat" },
                      { id: "V003", user: "Hendra Wijaya", document: "KTP", submissionDate: "2025-06-01 08:45:22", status: "Ditolak", action: "Lihat" }
                    ].map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell className="font-medium">{verification.id}</TableCell>
                        <TableCell>{verification.user}</TableCell>
                        <TableCell>{verification.document}</TableCell>
                        <TableCell>{verification.submissionDate}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            verification.status === 'Disetujui' ? 'bg-green-100 text-green-800' :
                            verification.status === 'Ditolak' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {verification.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {verification.action}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaksi PPOB</CardTitle>
                <CardDescription>Daftar semua transaksi PPOB yang telah dilakukan</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Nomor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Harga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id?.slice(0, 8)}</TableCell>
                          <TableCell>{transaction.product_name}</TableCell>
                          <TableCell>{transaction.customer_id}</TableCell>
                          <TableCell>{transaction.status}</TableCell>
                          <TableCell>{new Date(transaction.created_at || '').toLocaleString()}</TableCell>
                          <TableCell>Rp {(transaction.amount || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
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
                    <label htmlFor="product-select" className="block text-sm font-medium mb-1">Pilih Produk</label>
                    <Select onValueChange={setSelectedProduct}>
                      <SelectTrigger id="product-select">
                        <SelectValue placeholder="Pilih produk Digiflazz" />
                      </SelectTrigger>
                      <SelectContent>
                        {digiflazzProducts.map((product) => (
                          <SelectItem key={product.product_id || product.buyer_sku_code} value={product.buyer_sku_code}>
                            {product.product_name} - Rp {product.price?.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="customer-no" className="block text-sm font-medium mb-1">Nomor Pelanggan</label>
                    <Input id="customer-no" placeholder="Masukkan nomor pelanggan" value={customerNo} onChange={(e) => setCustomerNo(e.target.value)} />
                  </div>
                  <div>
                    <Button className="w-full" onClick={handleTestPurchase}>Tes Pembelian</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formData.id && currentFormType !== 'digiflazz' ? 'Edit' : 'Tambah'} {currentFormType === 'service' ? 'Layanan' : currentFormType === 'product' ? 'Produk' : 'Konfigurasi Digiflazz'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">{currentFormType === 'digiflazz' ? 'Username Digiflazz' : 'Nama'}</label>
              <Input name={currentFormType === 'digiflazz' ? 'username' : 'name'} value={currentFormType === 'digiflazz' ? formData.username : formData.name} onChange={handleInputChange} placeholder="Masukkan nama" required />
            </div>
            {currentFormType === "service" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <Input name="category" value={formData.category} onChange={handleInputChange} placeholder="Masukkan kategori" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ikon</label>
                  <Input name="icon" value={formData.icon} onChange={handleInputChange} placeholder="Masukkan nama ikon" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Warna</label>
                  <Input name="color" value={formData.color} onChange={handleInputChange} placeholder="Masukkan warna latar (hex)" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Warna Ikon</label>
                  <Input name="icon_color" value={formData.icon_color} onChange={handleInputChange} placeholder="Masukkan warna ikon (hex)" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rute</label>
                  <Input name="route" value={formData.route} onChange={handleInputChange} placeholder="Masukkan path rute" />
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is_new" 
                    name="is_new" 
                    checked={formData.is_new} 
                    onChange={handleInputChange} 
                    className="rounded"
                  />
                  <label htmlFor="is_new" className="text-sm font-medium">Layanan Baru?</label>
                </div>
              </>
            )}
            {currentFormType === "product" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Harga</label>
                  <Input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Masukkan harga" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deskripsi</label>
                  <Input name="description" value={formData.description} onChange={handleInputChange} placeholder="Masukkan deskripsi" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID Layanan</label>
                  <Input name="service_id" value={formData.service_id} onChange={handleInputChange} placeholder="Masukkan ID layanan terkait" required />
                </div>
              </>
            )}
            {currentFormType === "digiflazz" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <Input name="api_key" value={formData.api_key} onChange={handleInputChange} placeholder="Masukkan API Key" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mode</label>
                  <Select name="mode" value={formData.mode} onValueChange={(value) => setFormData(prev => ({ ...prev, mode: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="button" onClick={handleSave} disabled={isLoading}>Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
