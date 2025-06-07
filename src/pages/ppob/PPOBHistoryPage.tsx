import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/Icons";
import { PPOBTransactionDetails, PPOBTransaction } from "@/components/ppob/PPOBTransactionDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { cn, formatRupiah } from "@/lib/utils";
import { format, subDays, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { id } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
// Mock transaction data
const mockTransactions: PPOBTransaction[] = [
  {
    id: "TRX-123456",
    type: "payment",
    productCategory: "Electricity",
    productName: "PLN Postpaid",
    customerId: "1234567890",
    customerName: "Budi Santoso",
    amount: 150000,
    fee: 2500,
    totalAmount: 152500,
    status: "success",
    createdAt: "2025-06-01T14:30:25",
    updatedAt: "2025-06-01T14:32:10",
    paymentMethod: "PPOB Wallet",
    invoiceNumber: "INV-20250601-001",
    refNumber: "REF-123456789"
  },
  {
    id: "TRX-123457",
    type: "topup",
    productName: "Wallet Top Up",
    amount: 500000,
    fee: 0,
    totalAmount: 500000,
    status: "success",
    createdAt: "2025-06-02T10:15:30",
    updatedAt: "2025-06-02T10:16:45",
    paymentMethod: "Bank Transfer BCA",
    refNumber: "REF-987654321"
  },
  {
    id: "TRX-123458",
    type: "payment",
    productCategory: "Mobile Credit",
    productName: "Telkomsel Prepaid 50K",
    customerId: "081234567890",
    amount: 50000,
    fee: 1000,
    totalAmount: 51000,
    status: "success",
    createdAt: "2025-06-02T16:45:12",
    updatedAt: "2025-06-02T16:46:30",
    paymentMethod: "PPOB Wallet",
    invoiceNumber: "INV-20250602-002",
    refNumber: "REF-567891234"
  },
  {
    id: "TRX-123459",
    type: "payment",
    productCategory: "Water",
    productName: "PDAM",
    customerId: "9876543210",
    customerName: "Ani Wijaya",
    amount: 75000,
    fee: 2000,
    totalAmount: 77000,
    status: "pending",
    createdAt: "2025-06-03T09:20:05",
    updatedAt: "2025-06-03T09:20:05",
    paymentMethod: "PPOB Wallet",
    invoiceNumber: "INV-20250603-003",
    refNumber: "REF-345678912",
    message: "Pembayaran sedang diproses oleh PDAM."
  },
  {
    id: "TRX-123460",
    type: "payment",
    productCategory: "Internet",
    productName: "Indihome",
    customerId: "5432109876",
    customerName: "Dewi Sari",
    amount: 350000,
    fee: 2500,
    totalAmount: 352500,
    status: "failed",
    createdAt: "2025-06-03T11:30:20",
    updatedAt: "2025-06-03T11:35:40",
    paymentMethod: "PPOB Wallet",
    invoiceNumber: "INV-20250603-004",
    refNumber: "REF-234567891",
    message: "Pembayaran gagal: Saldo tidak mencukupi"
  },
  {
    id: "TRX-123461",
    type: "transfer",
    productName: "Transfer ke Bank BNI",
    customerId: "0987654321",
    customerName: "Rudi Hartono",
    amount: 1000000,
    fee: 6500,
    totalAmount: 1006500,
    status: "success",
    createdAt: "2025-06-03T13:45:10",
    updatedAt: "2025-06-03T13:47:25",
    paymentMethod: "PPOB Wallet",
    refNumber: "REF-123498765"
  },
  {
    id: "TRX-123462",
    type: "refund",
    productName: "Refund Telkomsel Prepaid",
    amount: 50000,
    fee: 0,
    totalAmount: 50000,
    status: "success",
    createdAt: "2025-06-03T15:20:30",
    updatedAt: "2025-06-03T15:22:15",
    refNumber: "REF-876543219",
    message: "Refund untuk transaksi gagal TRX-123463"
  }
];

export default function PPOBHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "in" | "out">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [period, setPeriod] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletOnly, setWalletOnly] = useState(false);
  
  // Check URL for filter parameters
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  
  // Set initial filter based on URL parameter if available
  useEffect(() => {
    if (filterParam === 'in') {
      setType('topup');
    } else if (filterParam === 'out') {
      setType('payment');
    }
  }, [filterParam]);
  const [selectedTransaction, setSelectedTransaction] = useState<PPOBTransaction | null>(null);
  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false);
  
  const periodOptions = [
    { value: "all", label: "Semua Periode" },
    { value: "this_month", label: "Bulan Ini" },
    { value: "last_month", label: "Bulan Lalu" },
    { value: "last_3_months", label: "3 Bulan Terakhir" },
    { value: "last_6_months", label: "6 Bulan Terakhir" },
    { value: "custom", label: "Periode Tertentu" }
  ];
  
  const typeOptions = [
    { value: "all", label: "Semua Transaksi" },
    { value: "payment", label: "Pembayaran" },
    { value: "topup", label: "Top Up" },
    { value: "transfer", label: "Transfer" },
    { value: "refund", label: "Refund" }
  ];
  
  const statusOptions = [
    { value: "all", label: "Semua Status", color: "gray" },
    { value: "success", label: "Berhasil", color: "green" },
    { value: "pending", label: "Dalam Proses", color: "yellow" },
    { value: "failed", label: "Gagal", color: "red" }
  ];
  
  // Filter transactions based on search, type, period, status, and wallet toggle
  const filteredTransactions = mockTransactions.filter((transaction) => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      transaction.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.customerId && transaction.customerId.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    // Period filter
    let matchesPeriod = true;
    if (period !== "all") {
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      const today = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (period === "today") {
        matchesPeriod = (
          transactionDate.getDate() === today &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      } else if (period === "week") {
        // Get the start of this week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        matchesPeriod = transactionDate >= startOfWeek;
      } else if (period === "month") {
        matchesPeriod = (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      }
    }
    
    if (!matchesPeriod) return false;
    
    // Type filter
    const matchesType = type === "all" || transaction.type === type;
    if (!matchesType) return false;
    
    // Status filter
    const matchesStatus = status === "all" || transaction.status === status;
    if (!matchesStatus) return false;
    
    // Wallet-only transactions filter
    if (walletOnly) {
      // Consider transactions related to wallet operations: top-ups, wallet payments, etc.
      const isWalletTransaction = 
        transaction.type === "topup" || 
        // Check withdraw type, which might be stored differently in some transactions
        (transaction as any).type === "withdraw" ||
        transaction.paymentMethod === "wallet" ||
        transaction.productName.toLowerCase().includes("wallet") ||
        // Also check for wallet in description if available
        ((transaction as any).description && (transaction as any).description.toLowerCase().includes("wallet"));
      
      return isWalletTransaction;
    }
    
    return true;
  });
  
  // Pagination logic
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const viewTransactionDetails = (transaction: PPOBTransaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailsOpen(true);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    if (!statusOption) return null;
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium bg-${statusOption.color}-100 text-${statusOption.color}-800`}>
        {statusOption.label}
      </span>
    );
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <Icons.creditCard className="h-5 w-5 text-blue-500" />;
      case "topup":
        return <Icons.plus className="h-5 w-5 text-green-500" />;
      case "transfer":
        return <Icons.arrowRight className="h-5 w-5 text-orange-500" />;
      case "refund":
        return <Icons.arrowRight className="h-5 w-5 text-purple-500 rotate-180" />;
      default:
        return <Icons.activity className="h-5 w-5" />;
    }
  };
  
  // Show a loading spinner while data is being fetched
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Apply filter when tab changes
  useEffect(() => {
    if (activeTab === "in") {
      setType("topup");
    } else if (activeTab === "out") {
      setType("payment");
    } else {
      setType("all");
    }
  }, [activeTab]);

  const handleFilter = () => {
    setIsFilterOpen(false);
    setIsLoading(true);
    // In a real app, this would apply filters and refetch data
  };

  // Helper function to group transactions by date
  const groupTransactionsByDate = (transactions: PPOBTransaction[]) => {
    return transactions.reduce<Record<string, PPOBTransaction[]>>((groups, transaction) => {
      // Format the date
      const dateObj = new Date(transaction.createdAt);
      let dateKey: string;
      
      if (isToday(dateObj)) {
        dateKey = "Hari Ini";
      } else if (isYesterday(dateObj)) {
        dateKey = "Kemarin";
      } else if (isThisWeek(dateObj)) {
        dateKey = format(dateObj, "EEEE", { locale: id });
      } else if (isThisMonth(dateObj)) {
        dateKey = format(dateObj, "d MMMM", { locale: id });
      } else {
        dateKey = format(dateObj, "d MMMM yyyy", { locale: id });
      }
      
      // Add transaction to the appropriate date group
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
      return groups;
    }, {});
  };
  
  // Function to handle refreshing the transaction list - defined once

  return (
    <MobileLayout>
      {/* Custom Header with Back Button */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={() => navigate("/ppob/wallet")} 
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold ml-4 flex-1">Riwayat Transaksi</h1>
          <button 
            onClick={handleRefresh}
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
          >
            <Icons.refreshCw className="h-4 w-4" />
          </button>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <button className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 ml-1">
                <Icons.filter className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filter Transaksi</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-5">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Periode</h3>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Jenis Transaksi</h3>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis transaksi" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Status</h3>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full bg-${option.color}-500 mr-2`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="walletOnly" 
                    checked={walletOnly}
                    onChange={(e) => setWalletOnly(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="walletOnly" className="text-sm font-medium">
                    Hanya transaksi dompet PPOB
                  </label>
                </div>
              </div>
              <SheetFooter>
                <Button onClick={handleFilter} className="w-full">
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Tabs for transaction type filtering */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "in" | "out")} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-gray-100 p-1 rounded-none">
            <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white">
              Semua
            </TabsTrigger>
            <TabsTrigger value="in" className="rounded-md data-[state=active]:bg-white">
              <Icons.arrowDownCircle className="h-4 w-4 mr-1 text-green-500" />
              Masuk
            </TabsTrigger>
            <TabsTrigger value="out" className="rounded-md data-[state=active]:bg-white">
              <Icons.arrowUpCircle className="h-4 w-4 mr-1 text-red-500" />
              Keluar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi..."
            className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200"
          />
        </div>
      </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cari Transaksi</label>
              <Input
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Periode</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="week">Minggu Ini</SelectItem>
                    <SelectItem value="month">Bulan Ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Jenis Transaksi</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis transaksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="payment">Pembayaran</SelectItem>
                    <SelectItem value="topup">Top Up</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pb-2">
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              <Button 
                variant={type === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("all")}
                className="whitespace-nowrap"
              >
                <Icons.activity className="mr-2 h-4 w-4" />
                Semua
              </Button>
              <Button 
                variant={type === "topup" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("topup")}
                className="whitespace-nowrap"
              >
                <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
                Masuk
              </Button>
              <Button 
                variant={type === "payment" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("payment")}
                className="whitespace-nowrap"
              >
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Keluar
              </Button>
              <Button 
                variant={type === "transfer" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("transfer")}
                className="whitespace-nowrap"
              >
                <Icons.repeat className="mr-2 h-4 w-4" />
                Transfer
              </Button>
              <Button 
                variant={type === "refund" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("refund")}
                className="whitespace-nowrap"
              >
                <Icons.undo className="mr-2 h-4 w-4" />
                Refund
              </Button>
            </div>

            <Button 
              variant={walletOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setWalletOnly(!walletOnly)}
              title={walletOnly ? "Semua Transaksi" : "Hanya Transaksi Wallet"}
            >
              <Icons.wallet className="mr-2 h-4 w-4" />
              {walletOnly ? "Semua Transaksi" : "Transaksi Wallet"}
            </Button>
          </div>
        </div>
        
        {/* Transaction History List */}
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-3 w-16 mt-2 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {/* Group transactions by date */}
              {Object.entries(groupTransactionsByDate(paginatedTransactions)).map(([date, transactions]) => (
                <div key={date} className="bg-white">
                  <div className="sticky top-0 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {date}
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                        onClick={() => viewTransactionDetails(transaction)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 bg-blue-50 rounded-full p-2 mt-0.5">
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{transaction.productName}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">{transaction.id}</p>
                              <div className="mt-1">
                                {getStatusBadge(transaction.status)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${transaction.type === 'topup' || transaction.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'topup' || transaction.type === 'refund' ? '+' : '-'}{formatRupiah(transaction.totalAmount)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(transaction.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-gray-50 rounded-full p-4 mb-4">
                <Icons.fileSearch className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900">Tidak ada transaksi</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Tidak ada transaksi yang sesuai dengan filter yang dipilih.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setType("all");
                  setStatus("all");
                  setPeriod("all");
                  setSearchQuery("");
                  setWalletOnly(false);
                  setActiveTab("all");
                }}
                className="mt-4"
              >
                <Icons.filterX className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          )}
        </ScrollArea>
        
        {/* Pagination */}
        {paginatedTransactions.length > 0 && totalPages > 1 && (
          <div className="py-4 border-t border-gray-100 bg-white sticky bottom-0 left-0 right-0 px-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) return null;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
        {/* Transaction Details Dialog */}
        <Dialog open={isTransactionDetailsOpen} onOpenChange={setIsTransactionDetailsOpen}>
          <DialogContent className="sm:max-w-md p-0">
            {selectedTransaction && (
              <PPOBTransactionDetails 
                transaction={selectedTransaction}
                onClose={() => setIsTransactionDetailsOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </MobileLayout>
  );
}
