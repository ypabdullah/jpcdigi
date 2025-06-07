import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send
} from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrderStatusUpdater } from '@/integrations/orders/order-status-service';
// Tidak menggunakan AuthContext, akan menerima adminId sebagai prop
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Status pesanan yang tersedia
const ORDER_STATUSES = [
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'paid', label: 'Pembayaran Diterima' },
  { value: 'processing', label: 'Sedang Diproses' },
  { value: 'shipped', label: 'Sedang Dikirim' },
  { value: 'delivered', label: 'Telah Diterima' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'refunded', label: 'Dana Dikembalikan' },
];

// Mendapatkan warna badge berdasarkan status
const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'shipped':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'delivered':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'refunded':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  adminId: string; // Admin ID sebagai prop, bukan dari context
  onStatusUpdated?: (newStatus: string) => void;
}

export function OrderStatusManager({ orderId, currentStatus, adminId, onStatusUpdated }: OrderStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // AdminId diterima sebagai prop, bukan dari auth context

  // Use our custom hook for updating order status
  const { updateStatus } = useOrderStatusUpdater();

  // Handle status change in dropdown
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    // Reset result message when selecting a new status
    setResultMessage(null);
  };

  // Handle update button click
  const handleUpdateStatus = async () => {
    if (!adminId) {
      setResultMessage({
        type: 'error',
        message: 'ID Admin tidak ditemukan. Silakan login kembali.'
      });
      return;
    }

    if (selectedStatus === currentStatus) {
      setResultMessage({
        type: 'error',
        message: 'Status yang dipilih sama dengan status saat ini.'
      });
      return;
    }

    setIsUpdating(true);
    setResultMessage(null);

    try {
      const result = await updateStatus(
        orderId,
        currentStatus,
        selectedStatus,
        adminId,
        {
          notes: notes.trim() || undefined,
          sendWhatsApp
        }
      );

      if (result.success) {
        setResultMessage({
          type: 'success',
          message: `Status pesanan berhasil diperbarui menjadi ${
            ORDER_STATUSES.find(s => s.value === selectedStatus)?.label || selectedStatus
          }${sendWhatsApp ? ' dan notifikasi WhatsApp telah dikirim ke pelanggan' : ''}.`
        });
        
        // Call the callback if provided
        if (onStatusUpdated) {
          onStatusUpdated(selectedStatus);
        }
      } else {
        setResultMessage({
          type: 'error',
          message: `Gagal memperbarui status: ${result.error?.message || 'Terjadi kesalahan.'}`
        });
      }
    } catch (error: any) {
      setResultMessage({
        type: 'error',
        message: `Error: ${error.message || 'Terjadi kesalahan yang tidak diketahui.'}`
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Update Status Pesanan</CardTitle>
        <CardDescription>
          Perbarui status pesanan dan kirim notifikasi WhatsApp ke pelanggan
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="current-status" className="text-sm font-medium mb-1 block">
            Status Saat Ini
          </Label>
          <div 
            id="current-status"
            className={`px-3 py-2 rounded-md border text-sm ${getStatusColorClass(currentStatus)}`}
          >
            {ORDER_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="new-status" className="text-sm font-medium">
            Status Baru
          </Label>
          <Select
            value={selectedStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger id="new-status" className="w-full">
              <SelectValue placeholder="Pilih status baru" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  disabled={status.value === currentStatus}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="status-notes" className="text-sm font-medium">
            Catatan (Opsional)
          </Label>
          <Textarea
            id="status-notes"
            placeholder="Tambahkan catatan tentang perubahan status ini"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isUpdating}
            className="resize-none"
            rows={2}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="send-whatsapp"
            checked={sendWhatsApp}
            onCheckedChange={setSendWhatsApp}
            disabled={isUpdating}
          />
          <Label htmlFor="send-whatsapp" className="cursor-pointer">
            Kirim notifikasi WhatsApp ke pelanggan
          </Label>
        </div>
        
        {resultMessage && (
          <Alert 
            variant={resultMessage.type === 'success' ? 'default' : 'destructive'}
            className={resultMessage.type === 'success' ? 'bg-green-50 border-green-200' : ''}
          >
            {resultMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {resultMessage.type === 'success' ? 'Berhasil' : 'Terjadi Kesalahan'}
            </AlertTitle>
            <AlertDescription>
              {resultMessage.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleUpdateStatus}
          disabled={isUpdating || selectedStatus === currentStatus}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Update Status & Kirim Notifikasi
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
