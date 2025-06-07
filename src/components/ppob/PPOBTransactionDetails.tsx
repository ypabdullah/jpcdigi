import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Icons } from "@/components/Icons";

// Define transaction type
export interface PPOBTransaction {
  id: string;
  type: "payment" | "topup" | "transfer" | "refund";
  productCategory?: string;
  productName: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  fee: number;
  totalAmount: number;
  status: "success" | "pending" | "failed";
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  refNumber?: string;
  message?: string;
}

interface PPOBTransactionDetailsProps {
  transaction: PPOBTransaction;
  onClose?: () => void;
}

export function PPOBTransactionDetails({ 
  transaction, 
  onClose 
}: PPOBTransactionDetailsProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy, HH:mm", { locale: id });
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Berhasil</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Dalam Proses</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Gagal</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case "payment":
        return "Pembayaran";
      case "topup":
        return "Top Up";
      case "transfer":
        return "Transfer";
      case "refund":
        return "Refund";
      default:
        return "Transaksi";
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
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

  const handleCopyToClipboard = () => {
    const transactionDetails = `
      ID Transaksi: ${transaction.id}
      Jenis: ${getTypeLabel()}
      Produk: ${transaction.productName}
      Total: ${formatCurrency(transaction.totalAmount)}
      Status: ${transaction.status}
      Tanggal: ${formatDate(transaction.createdAt)}
      ${transaction.refNumber ? `No. Referensi: ${transaction.refNumber}` : ""}
    `.trim();

    navigator.clipboard.writeText(transactionDetails).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsReportDialogOpen(false);
    setReportReason("");
  };

  return (
    <Card className="border shadow-md max-w-md w-full mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {getTypeIcon()}
            <div>
              <CardTitle className="text-lg">{getTypeLabel()}</CardTitle>
              <p className="text-sm text-muted-foreground">{transaction.productName}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge()}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <div className="space-y-5">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
            <p className="text-2xl font-bold">{formatCurrency(transaction.totalAmount)}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">ID Transaksi</p>
              <p className="text-sm font-medium">{transaction.id}</p>
            </div>
            
            {transaction.invoiceNumber && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">No. Invoice</p>
                <p className="text-sm font-medium">{transaction.invoiceNumber}</p>
              </div>
            )}
            
            {transaction.refNumber && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">No. Referensi</p>
                <p className="text-sm font-medium">{transaction.refNumber}</p>
              </div>
            )}
            
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Nominal</p>
              <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Biaya Admin</p>
              <p className="text-sm font-medium">{formatCurrency(transaction.fee)}</p>
            </div>
            
            {transaction.paymentMethod && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                <p className="text-sm font-medium">{transaction.paymentMethod}</p>
              </div>
            )}
            
            {transaction.customerId && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">ID Pelanggan</p>
                <p className="text-sm font-medium">{transaction.customerId}</p>
              </div>
            )}
            
            {transaction.customerName && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Nama Pelanggan</p>
                <p className="text-sm font-medium">{transaction.customerName}</p>
              </div>
            )}
          </div>

          {transaction.message && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pesan</p>
                <p className="text-sm">{transaction.message}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-6">
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={handleCopyToClipboard}>
            {copySuccess ? (
              <Icons.activity className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Icons.file className="mr-2 h-4 w-4" />
            )}
            {copySuccess ? "Disalin!" : "Salin"}
          </Button>
          
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Bagikan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Bagikan Bukti Transaksi</DialogTitle>
                <DialogDescription>
                  Bagikan bukti transaksi ini melalui:
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-4 gap-4 py-4">
                <Button variant="outline" className="flex flex-col items-center justify-center h-20">
                  <Icons.smartphone className="h-8 w-8 mb-1" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center justify-center h-20">
                  <Icons.smartphone className="h-8 w-8 mb-1" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center justify-center h-20">
                  <Icons.download className="h-8 w-8 mb-1" />
                  <span className="text-xs">Simpan</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center justify-center h-20">
                  <Icons.activity className="h-8 w-8 mb-1" />
                  <span className="text-xs">Lainnya</span>
                </Button>
              </div>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsShareDialogOpen(false)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Kembali
          </Button>
          
          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1 text-red-600 hover:text-red-700">
                <Icons.activity className="mr-2 h-4 w-4" />
                Laporkan Masalah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Laporkan Masalah Transaksi</DialogTitle>
                <DialogDescription>
                  Jelaskan masalah yang Anda alami dengan transaksi ini.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label
                    htmlFor="report-reason"
                    className="block text-sm font-medium mb-2"
                  >
                    Alasan Laporan
                  </label>
                  <select
                    id="report-reason"
                    className="w-full p-2 border rounded-md"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="">Pilih alasan</option>
                    <option value="not-received">Layanan tidak diterima</option>
                    <option value="wrong-amount">Jumlah salah</option>
                    <option value="double-charge">Tagihan ganda</option>
                    <option value="unauthorized">Transaksi tidak dikenal</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="report-details"
                    className="block text-sm font-medium mb-2"
                  >
                    Detail Masalah
                  </label>
                  <textarea
                    id="report-details"
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Jelaskan detail masalah yang Anda alami"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsReportDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleReportSubmit}
                  disabled={!reportReason || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Laporan"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
