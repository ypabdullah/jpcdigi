import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/Icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TransactionDetailProps {
  id: string;
  type: string;
  status: string;
  amount: number;
  date: Date;
  recipient?: {
    name: string;
    accountNumber?: string;
    phoneNumber?: string;
  };
  sender?: {
    name: string;
    accountNumber?: string;
  };
  description: string;
  referenceId: string;
  paymentMethod: string;
  fee?: number;
}

export default function PPOBTransactionDetailComponent({ transaction, onClose }: { transaction: TransactionDetailProps, onClose?: () => void }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "berhasil":
      case "success":
        return "bg-green-100 text-green-600";
      case "pending":
      case "menunggu":
        return "bg-yellow-100 text-yellow-600";
      case "gagal":
      case "failed":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "berhasil":
      case "success":
        return <Icons.check className="h-4 w-4" />;
      case "pending":
      case "menunggu":
        return <Icons.clock className="h-4 w-4" />;
      case "gagal":
      case "failed":
        return <Icons.activity className="h-4 w-4" />;
      default:
        return <Icons.activity className="h-4 w-4" />;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "top up":
      case "topup":
        return <Icons.arrowDownCircle className="h-10 w-10 text-green-500" />;
      case "withdrawal":
      case "tarik tunai":
        return <Icons.arrowUpCircle className="h-10 w-10 text-red-500" />;
      case "transfer":
      case "send":
        return <Icons.arrowRight className="h-10 w-10 text-blue-500" />;
      case "payment":
      case "pembayaran":
        return <Icons.creditCard className="h-10 w-10 text-purple-500" />;
      case "pulsa":
      case "data":
        return <Icons.smartphone className="h-10 w-10 text-indigo-500" />;
      default:
        return <Icons.creditCard className="h-10 w-10 text-gray-500" />;
    }
  };

  return (
    <div className="p-4 pt-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Detail Transaksi</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icons.plus className="h-5 w-5 rotate-45" />
          </Button>
        )}
      </div>

      {/* Transaction Status Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getTransactionTypeIcon(transaction.type)}
              <div className="ml-4">
                <h3 className="font-medium">{transaction.type}</h3>
                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-1 px-2 py-1`}>
              {getStatusIcon(transaction.status)}
              {transaction.status}
            </Badge>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Jumlah</p>
            <p className="text-xl font-bold">{formatCurrency(transaction.amount)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Card */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-4">
          {transaction.recipient && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Penerima</p>
              <p className="font-medium">{transaction.recipient.name}</p>
              {transaction.recipient.accountNumber && (
                <p className="text-sm">{transaction.recipient.accountNumber}</p>
              )}
              {transaction.recipient.phoneNumber && (
                <p className="text-sm">{transaction.recipient.phoneNumber}</p>
              )}
            </div>
          )}

          {transaction.sender && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Pengirim</p>
              <p className="font-medium">{transaction.sender.name}</p>
              {transaction.sender.accountNumber && (
                <p className="text-sm">{transaction.sender.accountNumber}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500 mb-1">Keterangan</p>
            <p className="font-medium">{transaction.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Info Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <p className="text-sm text-gray-500">ID Transaksi</p>
            <p className="text-sm font-medium">{transaction.id}</p>
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-gray-500">Waktu</p>
            <p className="text-sm font-medium">{formatDate(transaction.date)}</p>
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-gray-500">Metode Pembayaran</p>
            <p className="text-sm font-medium">{transaction.paymentMethod}</p>
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-gray-500">ID Referensi</p>
            <p className="text-sm font-medium">{transaction.referenceId}</p>
          </div>

          {transaction.fee !== undefined && (
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Biaya Layanan</p>
              <p className="text-sm font-medium">{formatCurrency(transaction.fee)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
