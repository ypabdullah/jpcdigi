import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { LineChart, BarChart } from "@/components/ui/admin-charts";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/utils";
import { AnalyticsSummary, Order, Product } from "@/data/models";

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("month"); // week, month, year
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalSales: 0,
    orderCount: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: []
  });
  
  const [salesByDate, setSalesByDate] = useState<{ date: string, total: number }[]>([]);
  const [productSales, setProductSales] = useState<{ name: string, total: number }[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Fungsi untuk mengekspor data ke CSV
  const exportToCSV = (exportType: 'orders' | 'products' | 'sales') => {
    setExportLoading(true);
    try {
      let csvContent = '';
      let filename = '';
      
      if (exportType === 'orders') {
        // Header
        csvContent = 'ID Pesanan,Tanggal,Status,Total\n';
        
        // Data
        allOrders.forEach(order => {
          csvContent += `"${order.id}","${new Date(order.date).toLocaleDateString()}","${order.status}","${order.total}"\n`;
        });
        
        filename = 'pesanan_export.csv';
      } else if (exportType === 'products') {
        // Header
        csvContent = 'Produk,Jumlah Terjual\n';
        
        // Data
        productSales.forEach(product => {
          csvContent += `"${product.name}","${product.total}"\n`;
        });
        
        filename = 'produk_terlaris_export.csv';
      } else { // sales
        // Header
        csvContent = 'Tanggal,Total Penjualan\n';
        
        // Data
        salesByDate.forEach(sale => {
          csvContent += `"${sale.date}","${sale.total}"\n`;
        });
        
        filename = 'penjualan_harian_export.csv';
      }
      
      // Create a Blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  };
  
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      // Get date range
      const today = new Date();
      let startDate = new Date();
      
      if (dateRange === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(today.getMonth() - 1);
      } else {
        startDate.setFullYear(today.getFullYear() - 1);
      }
      
      const startDateString = startDate.toISOString();
      
      // Fetch orders in date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('date', startDateString)
        .order('date', { ascending: false });
        
      if (ordersError) throw ordersError;
      
      // Calculate summary stats
      const totalSales = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const orderCount = orders?.length || 0;
      const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
      
      // For recent orders, we'll just use the first 5
      const recentOrders = orders?.slice(0, 5) || [];
      
      // For top products, we need to fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity')
        .in('order_id', orders?.map(o => o.id) || []);
        
      if (itemsError) throw itemsError;
      
      // Aggregate product sales
      const productSalesMap = new Map<string, { productId: string, productName: string, quantity: number }>();
      
      orderItems?.forEach(item => {
        const existing = productSalesMap.get(item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          productSalesMap.set(item.product_id, {
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity
          });
        }
      });
      
      // Convert to array and sort
      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
        
      // Group sales by date for the chart
      const salesByDateMap = new Map<string, number>();
      
      orders?.forEach(order => {
        const date = new Date(order.date).toLocaleDateString();
        const existing = salesByDateMap.get(date) || 0;
        salesByDateMap.set(date, existing + Number(order.total));
      });
      
      // Convert to array and sort by date
      const salesByDateArray = Array.from(salesByDateMap.entries()).map(
        ([date, total]) => ({ date, total })
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Save all orders for export functionality
      setAllOrders(orders || []);
      
      // Get product data for charts
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', topProducts.map(p => p.productId) || []);
        
      const productMap = new Map<string, string>();
      products?.forEach(product => productMap.set(product.id, product.name));
      
      const productSalesData = topProducts.map(p => ({
        name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
        total: p.quantity
      }));
      
      // Update state with typecasting to match our interfaces
      setSummary({
        totalSales,
        orderCount,
        averageOrderValue,
        topProducts,
        recentOrders: recentOrders as Order[]
      });
      
      setSalesByDate(salesByDateArray);
      setProductSales(productSalesData);
      
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-6">Dasbor Analitik</h1>
        
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
            <option value="year">Tahun Terakhir</option>
          </select>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalSales)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Pengguna dengan pesanan</p>
            <div className="text-2xl font-bold">{summary.orderCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nilai Pesanan Rata-rata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.averageOrderValue)}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Penjualan Bulanan</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => exportToCSV('sales')}
              disabled={exportLoading || isLoading}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">Loading...</div>
              ) : (
                <LineChart
                  data={salesByDate}
                  index="date"
                  categories={["total"]}
                  colors={["#FF7E47"]}
                  valueFormatter={(value: number) => formatRupiah(value)}
                  yAxisWidth={60}
                />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produk Terlaris</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => exportToCSV('products')}
              disabled={exportLoading || isLoading}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">Loading...</div>
              ) : (
                <BarChart
                  data={productSales}
                  index="name"
                  categories={["total"]}
                  colors={["#FF7E47"]}
                  valueFormatter={(value: number) => `${value} units`}
                  yAxisWidth={60}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pesanan Terbaru</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => exportToCSV('orders')}
            disabled={exportLoading || isLoading}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : summary.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">No orders found.</TableCell>
                </TableRow>
              ) : (
                summary.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(order.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
