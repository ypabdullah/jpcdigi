import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart } from "@/components/ui/admin-charts";
import { supabase } from "@/integrations/supabase/client";
import { Order, Product, ShippingMethod, UserProfile, CoalInventorySummary } from "@/data/models";
import { BarChart3, Package, ShoppingBag, Users, Truck, Layers, ArrowUpDown, PieChart, Warehouse, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { sendOrderNotificationToAdmins } from "@/integrations/firebase/notification-service";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalShippingMethods: 0
  });
  
  const [coalInventory, setCoalInventory] = useState<CoalInventorySummary | null>(null);
  
  // State untuk data keuangan
  const [financialData, setFinancialData] = useState({
    totalSales: 0,          // Total pendapatan dari penjualan
    totalPurchaseCost: 0,   // Total biaya pembelian arang
    profit: 0,              // Keuntungan (totalSales - totalPurchaseCost)
    profitMargin: 0         // Persentase keuntungan
  });

  const [salesData, setSalesData] = useState([
    { name: "Jan", total: 0 },
    { name: "Feb", total: 0 },
    { name: "Mar", total: 0 },
    { name: "Apr", total: 0 },
    { name: "May", total: 0 },
    { name: "Jun", total: 0 },
  ]);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      const [productsResult, ordersResult, usersResult, shippingResult, coalResult, coalTransactionsResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('shipping_methods').select('id', { count: 'exact', head: true }),
        supabase.from('coal_inventory_summary').select('*').maybeSingle(),
        supabase.from('coal_inventory_transactions').select('*')
      ]);

      setStats({
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalShippingMethods: shippingResult.count || 0
      });
      
      // Set coal inventory data if available
      if (coalResult.data) {
        setCoalInventory(coalResult.data);
      }

      // Menghitung data keuangan
      // Ambil semua pesanan untuk menghitung total penjualan
      const { data: orders } = await supabase
        .from('orders')
        .select('date, total, status')
        .neq('status', 'canceled') // Tidak termasuk pesanan yang dibatalkan
        .order('date', { ascending: false })
        .limit(100);

      if (orders) {
        // Hitung total penjualan dari semua pesanan yang tidak dibatalkan
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
        
        // Process orders into monthly data for chart
        const monthlyData = [0, 0, 0, 0, 0, 0]; // Jan sampai Jun
        orders.forEach(order => {
          const date = new Date(order.date);
          const month = date.getMonth();
          if (month < 6) {
            monthlyData[month] += Number(order.total);
          }
        });
        
        // Update chart data
        setSalesData([
          { name: "Jan", total: monthlyData[0] },
          { name: "Feb", total: monthlyData[1] },
          { name: "Mar", total: monthlyData[2] },
          { name: "Apr", total: monthlyData[3] },
          { name: "Mei", total: monthlyData[4] },
          { name: "Jun", total: monthlyData[5] },
        ]);
        
        // Hitung total biaya pembelian arang dari transaksi incoming
        let totalPurchaseCost = 0;
        if (coalTransactionsResult.data) {
          const incomingTransactions = coalTransactionsResult.data.filter(t => 
            t.transaction_type === 'incoming' && t.vehicle_info !== 'cancelled_order_return'
          );
          
          // Hitung total biaya pembelian (harga per kg * jumlah kg)
          totalPurchaseCost = incomingTransactions.reduce((sum, transaction) => {
            const cost = (transaction.price_per_kg || 0) * transaction.quantity_kg;
            return sum + cost;
          }, 0);
        }
        
        // Hitung keuntungan
        const profit = totalSales - totalPurchaseCost;
        
        // Hitung persentase margin keuntungan
        const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;
        
        // Update state data keuangan
        setFinancialData({
          totalSales,
          totalPurchaseCost,
          profit,
          profitMargin
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dasbor Admin</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produk</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-500">Total produk</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pesanan</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500">Total pesanan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengguna</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">Pengguna terdaftar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Metode Pengiriman</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShippingMethods}</div>
            <p className="text-xs text-gray-500">Opsi pengiriman tersedia</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Overview Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              <span>Ringkasan Keuangan</span>
            </div>
          </CardTitle>
          <CardDescription>
            Analisis penghasilan, biaya, dan keuntungan dari penjualan arang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Penjualan</p>
                    <h3 className="text-xl font-bold text-green-600">
                      {formatRupiah(financialData.totalSales)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Biaya Pembelian</p>
                    <h3 className="text-xl font-bold text-red-600">
                      {formatRupiah(financialData.totalPurchaseCost)}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {financialData.profit >= 0 ? 'Keuntungan' : 'Kerugian'}
                    </p>
                    <h3 className="text-xl font-bold" style={{ color: financialData.profit >= 0 ? '#047857' : '#dc2626' }}>
                      {formatRupiah(Math.abs(financialData.profit))}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full" 
                    style={{ backgroundColor: financialData.profit >= 0 ? '#DCFCE7' : '#FEE2E2' }}>
                    {financialData.profit >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Margin</p>
                    <h3 className="text-xl font-bold" style={{ color: financialData.profit >= 0 ? '#047857' : '#dc2626' }}>
                      {financialData.profitMargin.toFixed(2)}%
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Coal Inventory Management Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <Warehouse className="h-5 w-5 mr-2" />
              <span>Manajemen Stok Arang</span>
            </div>
            <Link to="/admin/coal-inventory">
              <Button className="bg-flame-500 hover:bg-flame-600">
                <Layers className="h-4 w-4 mr-2" />
                Kelola Stok Arang
              </Button>
            </Link>
          </CardTitle>
          <CardDescription>
            Lihat ringkasan stok arang dan catat transaksi masuk/keluar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Stok Saat Ini</p>
                    <h3 className="text-2xl font-bold">
                      {coalInventory?.current_stock_kg?.toLocaleString('id-ID') || '0'} kg
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Warehouse className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Pemasukan</p>
                    <h3 className="text-2xl font-bold">
                      {coalInventory?.total_incoming_kg?.toLocaleString('id-ID') || '0'} kg
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <ArrowUpDown className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Nilai Stok</p>
                    <h3 className="text-xl font-bold">
                      {coalInventory ? formatRupiah(coalInventory.stock_value) : 'Rp 0'}
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-4">
            <Link to="/admin/coal-inventory">
              <Button variant="outline" className="w-full max-w-md">
                Lihat Detail Transaksi Stok Arang
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Sales Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ringkasan Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <BarChart
              data={salesData}
              index="name"
              categories={["total"]}
              colors={["#FF7E47"]}
              yAxisWidth={60}
              valueFormatter={(value: number) => formatRupiah(value)}
            />
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
