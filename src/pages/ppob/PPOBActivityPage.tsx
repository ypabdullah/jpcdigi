import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icons } from "@/components/Icons";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PPOBTransactionDetail } from "@/components/ppob/PPOBTransactionDetail";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Define transaction types
interface Transaction {
  id: string;
  type: "send" | "topup" | "payment" | "withdrawal" | "request";
  amount: number;
  date: string;
  recipient?: {
    name: string;
    bankAccount?: string;
    bankName?: string;
  };
  sender?: {
    name: string;
    bankAccount?: string;
    bankName?: string;
  };
  status: "success" | "pending" | "failed";
  description: string;
}

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    id: "TRX-20250601-001",
    type: "send",
    amount: 950000,
    date: "2025-06-01T23:57:00",
    recipient: {
      name: "YOGA PRASETYA",
      bankAccount: "****0549",
      bankName: "Seabank Indonesia"
    },
    status: "success",
    description: "Kirim ke YOGA PRASETYA"
  },
  {
    id: "TRX-20250601-002",
    type: "topup",
    amount: 250000,
    date: "2025-06-01T23:38:00",
    status: "success",
    description: "Isi Saldo"
  },
  {
    id: "TRX-20250601-003",
    type: "topup",
    amount: 200000,
    date: "2025-06-01T15:59:00",
    status: "success",
    description: "Isi Saldo"
  },
  {
    id: "TRX-20250601-004",
    type: "topup",
    amount: 500000,
    date: "2025-06-01T15:58:00",
    status: "success",
    description: "Isi Saldo"
  },
  {
    id: "TRX-20250528-001",
    type: "send",
    amount: 2099000,
    date: "2025-05-28T20:47:00",
    recipient: {
      name: "YOGA PRASETYA",
      bankAccount: "****0549",
      bankName: "Seabank Indonesia"
    },
    status: "success",
    description: "Kirim ke YOGA PRASETYA"
  },
  {
    id: "TRX-20250528-002",
    type: "topup",
    amount: 200000,
    date: "2025-05-28T20:28:00",
    status: "success",
    description: "Isi Saldo"
  },
  {
    id: "TRX-20250528-003",
    type: "topup",
    amount: 900000,
    date: "2025-05-28T20:27:00",
    status: "success",
    description: "Isi Saldo"
  },
  {
    id: "TRX-20250528-004",
    type: "topup",
    amount: 900000,
    date: "2025-05-28T20:26:00",
    status: "success",
    description: "Isi Saldo"
  }
];

export default function PPOBActivityPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Group transactions by month
  const groupedTransactions = React.useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      
      groups[monthKey].push(transaction);
    });
    
    return Object.entries(groups).map(([key, transactions]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month);
      
      const totalOut = transactions
        .filter(t => t.type === "send" || t.type === "payment" || t.type === "withdrawal")
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        monthName: format(date, "MMMM yyyy", { locale: id }),
        transactions,
        totalOut
      };
    }).sort((a, b) => {
      // Sort by most recent month first
      const aDate = new Date(a.transactions[0].date);
      const bDate = new Date(b.transactions[0].date);
      return bDate.getTime() - aDate.getTime();
    });
  }, [filteredTransactions]);
  
  useEffect(() => {
    // Simulate loading transaction data
    const fetchTransactions = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setIsLoading(false);
    };
    
    fetchTransactions();
  }, []);
  
  useEffect(() => {
    // Filter transactions based on search query
    if (searchQuery.trim() === "") {
      setFilteredTransactions(transactions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = transactions.filter(
        transaction => 
          transaction.id.toLowerCase().includes(query) ||
          transaction.description.toLowerCase().includes(query) ||
          (transaction.recipient?.name && transaction.recipient.name.toLowerCase().includes(query))
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  // We're using the formatRupiah utility from utils.ts
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy • HH:mm", { locale: id });
  };

  return (
    <MobileLayout>
      <Helmet>
        <title>Aktivitas Transaksi - JPC Digi</title>
      </Helmet>
      
      <div className="bg-primary text-white p-4">
        <h1 className="text-xl font-bold mb-4">Aktivitas</h1>
        
        <div className="relative mb-2">
          <Input
            className="bg-white pl-10"
            placeholder="Cari kirim uang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
              <Icons.sort className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
              <Icons.filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div>
            {groupedTransactions.map((group, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                  <h2 className="font-medium">{group.monthName}</h2>
                  <div className="text-right">
                    <span className="text-red-500">-{formatRupiah(group.totalOut)}</span>
                    <Icons.chevronRight className="inline-block ml-1 h-4 w-4 text-primary" />
                  </div>
                </div>
                
                <div>
                  {group.transactions.map((transaction) => {
                    const isDebit = transaction.type === "send" || transaction.type === "payment" || transaction.type === "withdrawal";
                    
                    return (
                      <div 
                        key={transaction.id} 
                        className="p-4 border-b cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setIsDetailOpen(true);
                        }}
                      >
                        <div className="flex items-center">
                          <div className="mr-3">
                            {transaction.type === "send" ? (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Icons.arrowUpFromLine className="h-5 w-5 text-blue-500" />
                              </div>
                            ) : transaction.type === "topup" ? (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Icons.plus className="h-5 w-5 text-green-500" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Icons.shopping className="h-5 w-5 text-red-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-medium ${isDebit ? 'text-red-500' : 'text-green-500'}`}>
                                  {isDebit ? '-' : '+'}{formatRupiah(transaction.amount)}
                                </p>
                                <div className="mt-1">
                                  <Button variant="ghost" size="sm" className="h-6 p-0">
                                    <Icons.trash className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => setIsDetailOpen(open)}>
        <DialogContent className="max-w-md p-0 h-[85vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <PPOBTransactionDetail 
              transaction={selectedTransaction} 
              onClose={() => setIsDetailOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
