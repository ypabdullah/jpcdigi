import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Icons } from "@/components/Icons";

type TransactionStatus = "success" | "pending" | "failed";

type PPOBTransaction = {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  detail?: Record<string, string | number>;
};

interface PPOBHistoryProps {
  limit?: number;
}

export function PPOBHistory({ limit }: PPOBHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<PPOBTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Dummy transaction data
  const transactions: PPOBTransaction[] = [
    {
      id: "tx1",
      type: "bill_payment",
      description: "Tagihan Listrik PLN",
      amount: 250000,
      date: "2025-06-01T14:30:00",
      status: "success",
      detail: {
        customer_id: "12345678901",
        customer_name: "John Doe",
        period: "Mei 2025",
        bill_amount: 247500,
        admin_fee: 2500
      }
    },
    {
      id: "tx2",
      type: "digital_product",
      description: "Pulsa Telkomsel",
      amount: 51000,
      date: "2025-05-30T10:15:00",
      status: "success",
      detail: {
        phone_number: "081234567890",
        product: "Pulsa Rp 50.000",
        admin_fee: 1000
      }
    },
    {
      id: "tx3",
      type: "fund_transfer",
      description: "Transfer ke BCA",
      amount: 500000,
      date: "2025-05-28T16:45:00",
      status: "success",
      detail: {
        bank: "BCA",
        account_number: "1234567890",
        recipient_name: "Jane Doe",
        note: "Pembayaran invoice #123"
      }
    },
    {
      id: "tx4",
      type: "digital_product",
      description: "Paket Data XL",
      amount: 80000,
      date: "2025-05-25T09:20:00",
      status: "success",
      detail: {
        phone_number: "087654321098",
        product: "Paket Data 15GB 30 Hari",
        admin_fee: 0
      }
    },
    {
      id: "tx5",
      type: "bill_payment",
      description: "BPJS Kesehatan",
      amount: 150000,
      date: "2025-05-20T13:10:00",
      status: "success",
      detail: {
        va_number: "8888801234567890",
        customer_name: "John Doe",
        period: "Juni 2025",
        bill_amount: 147500,
        admin_fee: 2500
      }
    },
    {
      id: "tx6",
      type: "digital_product",
      description: "Token Listrik",
      amount: 101000,
      date: "2025-05-18T11:05:00",
      status: "success",
      detail: {
        meter_number: "12345678901",
        token_code: "1234-5678-9012-3456-7890",
        product: "Token Listrik Rp 100.000",
        admin_fee: 1000
      }
    },
    {
      id: "tx7",
      type: "fund_transfer",
      description: "Transfer ke DANA",
      amount: 200000,
      date: "2025-05-15T17:30:00",
      status: "success",
      detail: {
        wallet: "DANA",
        phone_number: "081234567890",
        admin_fee: 0
      }
    }
  ];
  
  // Limit the number of transactions to display if specified
  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;
  
  const handleViewDetail = (transaction: PPOBTransaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };
  
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Berhasil</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Diproses</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Gagal</Badge>;
      default:
        return null;
    }
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "bill_payment":
        return <Icons.file className="h-5 w-5 text-blue-500" />;
      case "digital_product":
        return <Icons.smartphone className="h-5 w-5 text-purple-500" />;
      case "fund_transfer":
        return <Icons.arrowRight className="h-5 w-5 text-green-500" />;
      default:
        return <Icons.activity className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div>
      {displayedTransactions.length > 0 ? (
        <div className="space-y-3">
          {displayedTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{transaction.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'fund_transfer' ? 'text-red-500' : 'text-primary'}`}>
                      {transaction.type === 'fund_transfer' ? '-' : ''}
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2" 
                  onClick={() => handleViewDetail(transaction)}
                >
                  Lihat Detail
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Icons.inbox className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Belum Ada Transaksi</h3>
          <p className="text-sm text-muted-foreground">
            Transaksi PPOB Anda akan muncul di sini
          </p>
        </div>
      )}
      
      {/* Transaction Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="py-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedTransaction.description}</h3>
                {getStatusBadge(selectedTransaction.status)}
              </div>
              
              <div className="border rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Transaksi</span>
                    <span className="font-mono">{selectedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span>{formatDate(selectedTransaction.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jenis Transaksi</span>
                    <span>
                      {selectedTransaction.type === "bill_payment" && "Pembayaran Tagihan"}
                      {selectedTransaction.type === "digital_product" && "Produk Digital"}
                      {selectedTransaction.type === "fund_transfer" && "Transfer Dana"}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedTransaction.detail && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Detail Produk</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedTransaction.detail).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        <span>
                          {typeof value === 'number' && key.includes('amount') || key.includes('fee') 
                            ? `Rp ${value.toLocaleString('id-ID')}`
                            : value.toString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Rincian Biaya</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bayar</span>
                    <span className="font-bold">Rp {selectedTransaction.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                Unduh Bukti Transaksi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
