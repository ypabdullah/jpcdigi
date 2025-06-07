import React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface TransactionDetailProps {
  transaction: {
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
    paymentMethod?: string;
    merchantOrderId?: string;
    externalSerialNumber?: string;
  };
  onClose: () => void;
}

export function PPOBTransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy • HH:mm", { locale: id });
  };

  // Generate transaction ID display
  const displayTransactionId = () => {
    const dateStr = format(new Date(transaction.date), "yyyyMMdd");
    const randomDigits = Math.floor(Math.random() * 100000000000).toString().padStart(12, '0');
    return `${dateStr}${randomDigits}`;
  };

  // Generate external serial number
  const generateExternalSerial = () => {
    const dateStr = format(new Date(transaction.date), "yyyyMMdd");
    const prefix = transaction.type === "topup" ? "DANAID" : "DANAPY";
    const suffix = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return `${dateStr}${prefix}J${dateStr.slice(-2)}${suffix}`;
  };

  // Generate merchant order ID
  const generateMerchantId = () => {
    return `• • • ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-16">
        {/* Header with logo */}
        <div className="bg-white p-4 flex flex-col items-center">
          <div className="w-16 h-16 mb-2">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Icons.wallet className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
            <p className="text-lg font-bold mt-1">ID JPC {transaction.id}</p>
          </div>

          {/* Status */}
          <div className="flex items-center mt-2 bg-green-50 text-green-600 px-3 py-1 rounded-full">
            <Icons.check className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Transaksi berhasil!</span>
          </div>
        </div>

        {/* Transaction details */}
        <Card className="mx-4 my-4 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {transaction.type === "topup" ? (
                    <Icons.arrowDownCircle className="h-6 w-6 text-green-500" />
                  ) : transaction.type === "withdrawal" ? (
                    <Icons.arrowUpCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <Icons.creditCard className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium">{transaction.type === "topup" ? "Top Up" : transaction.type === "send" ? "Transfer" : transaction.type}</h3>
                  <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <Badge className={`flex items-center gap-1 px-2 py-1 ${transaction.status === "success" ? "bg-green-100 text-green-600" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}>
                {transaction.status === "success" ? (
                  <Icons.check className="h-4 w-4" />
                ) : transaction.status === "pending" ? (
                  <Icons.clock className="h-4 w-4" />
                ) : (
                  <Icons.activity className="h-4 w-4" />
                )}
                {transaction.status === "success" ? "Berhasil" : transaction.status === "pending" ? "Menunggu" : "Gagal"}
              </Badge>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Jumlah</p>
              <p className="text-xl font-bold">{formatCurrency(transaction.amount)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Recipient details (if applicable) */}
        {transaction.type === "send" && transaction.recipient && (
          <Card className="mx-4 my-4 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-bold mb-4">Detail Penerima</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama</span>
                  <span className="font-medium">{transaction.recipient.name}</span>
                </div>
                
                {transaction.recipient.bankAccount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Akun Bank</span>
                    <span>{transaction.recipient.bankAccount}</span>
                  </div>
                )}
                
                {transaction.recipient.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bank</span>
                    <span>{transaction.recipient.bankName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Transaction details */}
        <Card className="mx-4 my-4 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">Detail Transaksi</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-gray-500">ID Transaksi</span>
                <div className="flex items-center">
                  <span className="text-right">{displayTransactionId()}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                    <Icons.copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">ID Order Merchant</span>
                <span>{transaction.merchantOrderId || generateMerchantId()}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-500">External Serial Number</span>
                <div className="text-right">
                  <span>{transaction.externalSerialNumber || generateExternalSerial()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button className="w-full" size="lg">
          <Icons.messageSquare className="mr-2 h-5 w-5" />
          BUTUH BANTUAN?
        </Button>
      </div>
    </div>
  );
}
