import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/Icons";

// Mock data for wallet transactions
const mockTransactions: Transaction[] = [
  {
    id: "TRX-12345",
    type: "topup",
    amount: 500000,
    date: "2025-06-02T10:15:30",
    status: "success",
    description: "Top Up via BCA Virtual Account",
    source: "BCA Virtual Account",
    balance: 500000
  },
  {
    id: "TRX-12346",
    type: "payment",
    amount: -150000,
    date: "2025-06-02T14:30:25",
    status: "success",
    description: "Pembayaran Tagihan PLN",
    source: "PLN Postpaid",
    balance: 350000
  },
  {
    id: "TRX-12347",
    type: "payment",
    amount: -50000,
    date: "2025-06-02T16:45:12",
    status: "success",
    description: "Pembelian Pulsa Telkomsel",
    source: "Telkomsel Prepaid",
    balance: 300000
  },
  {
    id: "TRX-12348",
    type: "payment",
    amount: -75000,
    date: "2025-06-02T18:20:05",
    status: "success",
    description: "Pembayaran PDAM",
    source: "PDAM",
    balance: 225000
  },
  {
    id: "TRX-12349",
    type: "topup",
    amount: 200000,
    date: "2025-06-03T09:10:45",
    status: "success",
    description: "Top Up via DANA",
    source: "DANA",
    balance: 425000
  },
  {
    id: "TRX-12350",
    type: "payment",
    amount: -100000,
    date: "2025-06-03T11:30:20",
    status: "success",
    description: "Pembelian Token Listrik",
    source: "PLN Prepaid",
    balance: 325000
  },
  {
    id: "TRX-12351",
    type: "payment",
    amount: -25000,
    date: "2025-06-03T13:45:10",
    status: "success",
    description: "Pembayaran Telkom IndiHome",
    source: "Telkom",
    balance: 300000
  },
  {
    id: "TRX-12352",
    type: "topup",
    amount: 100000,
    date: "2025-06-03T15:20:30",
    status: "pending",
    description: "Top Up via OVO",
    source: "OVO",
    balance: 300000
  },
  {
    id: "TRX-12353",
    type: "payment",
    amount: -80000,
    date: "2025-06-03T16:50:15",
    status: "failed",
    description: "Pembelian Paket Data XL",
    source: "XL Data",
    balance: 300000
  }
];

// Interface for transaction
interface Transaction {
  id: string;
  type: "topup" | "payment" | "withdrawal" | "refund";
  amount: number;
  date: string;
  status: "success" | "pending" | "failed";
  description: string;
  source: string;
  balance: number;
}

interface PPOBWalletStatementProps {
  className?: string;
}

export function PPOBWalletStatement({ className }: PPOBWalletStatementProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("this-month");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Simulate API call to fetch wallet transactions
    const fetchTransactions = async () => {
      setIsLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setIsLoading(false);
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [activeTab, period, searchQuery, transactions]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by tab
    if (activeTab === "topup") {
      filtered = filtered.filter(tx => tx.type === "topup");
    } else if (activeTab === "payment") {
      filtered = filtered.filter(tx => tx.type === "payment");
    }

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    switch (period) {
      case "today":
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= today;
        });
        break;
      case "yesterday":
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= yesterday && txDate < today;
        });
        break;
      case "this-week":
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= thisWeekStart;
        });
        break;
      case "this-month":
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= thisMonthStart;
        });
        break;
      case "last-month":
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= lastMonthStart && txDate <= lastMonthEnd;
        });
        break;
      // Default is "all", no additional filtering needed
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tx =>
          tx.id.toLowerCase().includes(query) ||
          tx.description.toLowerCase().includes(query) ||
          tx.source.toLowerCase().includes(query)
      );
    }

    // Sort by date, newest first
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy, HH:mm", { locale: id });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getTotalIncome = () => {
    return filteredTransactions
      .filter(tx => tx.amount > 0 && tx.status === "success")
      .reduce((total, tx) => total + tx.amount, 0);
  };

  const getTotalExpense = () => {
    return filteredTransactions
      .filter(tx => tx.amount < 0 && tx.status === "success")
      .reduce((total, tx) => total + Math.abs(tx.amount), 0);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "topup":
        return <Icons.plus className="h-4 w-4 text-green-500" />;
      case "payment":
        return <Icons.creditCard className="h-4 w-4 text-blue-500" />;
      case "withdrawal":
        return <Icons.arrowRight className="h-4 w-4 text-orange-500" />;
      case "refund":
        return <Icons.arrowRight className="h-4 w-4 text-purple-500 rotate-180" />;
      default:
        return <Icons.activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Sukses</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Gagal</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle>Mutasi Dompet PPOB</CardTitle>
        <CardDescription>
          Riwayat transaksi dompet PPOB Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter controls */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3 sm:items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="topup">Top Up</TabsTrigger>
              <TabsTrigger value="payment">Pembayaran</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex space-x-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="this-week">Minggu Ini</SelectItem>
                <SelectItem value="this-month">Bulan Ini</SelectItem>
                <SelectItem value="last-month">Bulan Lalu</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[200px]"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Saldo Terakhir</p>
                <p className="text-2xl font-bold">
                  {transactions.length > 0 
                    ? formatCurrency(transactions[0].balance) 
                    : "Rp 0"}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalIncome())}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(getTotalExpense())}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Transactions table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.source}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.amount > 0 ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <Icons.download className="mr-2 h-4 w-4" />
          Unduh PDF
        </Button>
        <Button variant="outline">
          <Icons.download className="mr-2 h-4 w-4" />
          Unduh CSV
        </Button>
      </CardFooter>
    </Card>
  );
}
