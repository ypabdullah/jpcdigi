import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Megaphone,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  UserCheck,
  CalendarDays,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppBroadcastService, BroadcastOptions } from '@/integrations/whatsapp/broadcast-service';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Tipe komponen utama
export function BroadcastPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);

  // State untuk komponen New Broadcast
  const [recipientType, setRecipientType] = useState<'all' | 'selected' | 'filtered'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [includeName, setIncludeName] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // Filter options
  const [lastOrderDays, setLastOrderDays] = useState<number | undefined>(undefined);
  const [minOrderCount, setMinOrderCount] = useState<number | undefined>(undefined);
  const [minTotalSpent, setMinTotalSpent] = useState<number | undefined>(undefined);

  // Template pesan yang umum digunakan
  const messageTemplates = [
    {
      name: 'Diskon',
      content: 'Halo {name},\n\nJPC Apps memberikan DISKON SPESIAL 20% untuk semua produk arang premium kami hingga akhir bulan ini!\n\nKunjungi website kami sekarang untuk melihat koleksi terbaik kami.\n\nSalam,\nTim JPC Apps'
    },
    {
      name: 'Produk Baru',
      content: 'Halo {name},\n\nKabar gembira! JPC Apps baru saja meluncurkan produk arang premium terbaru dengan kualitas terbaik dan harga kompetitif.\n\nKunjungi website kami untuk menjadi yang pertama mencobanya!\n\nSalam,\nTim JPC Apps'
    },
    {
      name: 'Pengingat',
      content: 'Halo {name},\n\nSudah lama tidak melihat Anda berbelanja di JPC Apps. Kami merindukan Anda!\n\nDapatkan DISKON 10% untuk pembelian berikutnya dengan menggunakan kode: COMEBACK10\n\nSalam,\nTim JPC Apps'
    }
  ];

  // Ambil data pelanggan
  useEffect(() => {
    if (activeTab === 'new') {
      fetchCustomers();
    } else if (activeTab === 'history') {
      fetchBroadcastHistory();
    }
  }, [activeTab, historyPage]);

  // Fungsi untuk mengambil data pelanggan
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, email, created_at')
        .not('phone', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Gagal mengambil data pelanggan',
        description: 'Terjadi kesalahan saat mengambil data pelanggan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk mengambil riwayat broadcast
  const fetchBroadcastHistory = async () => {
    setIsLoading(true);
    try {
      const data = await WhatsAppBroadcastService.getBroadcastHistory(10, historyPage);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
      toast({
        title: 'Gagal mengambil riwayat broadcast',
        description: 'Terjadi kesalahan saat mengambil riwayat broadcast',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle pilihan pelanggan
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId) 
        : [...prev, customerId]
    );
  };

  // Pilih semua pelanggan
  const selectAllCustomers = () => {
    setSelectedCustomers(customers.map(c => c.id));
  };

  // Reset pilihan pelanggan
  const resetCustomerSelection = () => {
    setSelectedCustomers([]);
  };

  // Handler submit broadcast
  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      toast({
        title: 'Pesan tidak boleh kosong',
        description: 'Silakan masukkan pesan yang akan dikirim',
        variant: 'destructive',
      });
      return;
    }

    if (recipientType === 'selected' && selectedCustomers.length === 0) {
      toast({
        title: 'Tidak ada penerima yang dipilih',
        description: 'Silakan pilih setidaknya satu pelanggan',
        variant: 'destructive',
      });
      return;
    }

    // Konfirmasi pengiriman
    if (!window.confirm(`Anda akan mengirim pesan broadcast ke ${
      recipientType === 'all' 
        ? 'semua pelanggan'
        : recipientType === 'selected'
          ? `${selectedCustomers.length} pelanggan terpilih`
          : 'pelanggan yang difilter'
    }. Lanjutkan?`)) {
      return;
    }

    setIsSending(true);
    try {
      const options: BroadcastOptions = {
        recipientType,
        message,
        includeName,
      };

      if (recipientType === 'selected') {
        options.selectedIds = selectedCustomers;
      } else if (recipientType === 'filtered') {
        options.filterOptions = {
          lastOrderDays,
          minOrderCount,
          minTotalSpent
        };
      }

      // Tambahkan jadwal jika diaktifkan
      if (isScheduled && scheduleDate && scheduleTime) {
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledDateTime > new Date()) {
          options.scheduleTime = scheduledDateTime;
        } else {
          toast({
            title: 'Waktu jadwal tidak valid',
            description: 'Waktu jadwal harus di masa depan',
            variant: 'destructive',
          });
          setIsSending(false);
          return;
        }
      }

      const result = await WhatsAppBroadcastService.sendBroadcast(options);
      
      if (result.success) {
        toast({
          title: 'Broadcast berhasil',
          description: isScheduled 
            ? `Broadcast dijadwalkan untuk ${result.totalRecipients} penerima` 
            : `Pesan berhasil dikirim ke ${result.sentCount} dari ${result.totalRecipients} penerima`,
        });
        
        // Reset form
        setMessage('');
        setSelectedCustomers([]);
        setRecipientType('all');
        setIsScheduled(false);
        setScheduleDate('');
        setScheduleTime('');
        
        // Pindah ke tab history
        setActiveTab('history');
        fetchBroadcastHistory();
      } else {
        toast({
          title: 'Broadcast gagal',
          description: `Pesan gagal dikirim. Hanya ${result.sentCount} dari ${result.totalRecipients} pesan yang terkirim.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Broadcast gagal',
        description: 'Terjadi kesalahan saat mengirim broadcast',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Gunakan template pesan
  const useMessageTemplate = (templateContent: string) => {
    setMessage(templateContent);
  };

  return (
    <AdminLayout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Broadcast WhatsApp</h1>
        
        <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="new">
              <Megaphone className="h-4 w-4 mr-2" />
              Broadcast Baru
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Riwayat Broadcast
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Panel Pesan */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Pesan Broadcast</CardTitle>
                  <CardDescription>
                    Buat pesan broadcast untuk dikirim ke pelanggan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message-type">Jenis Penerima</Label>
                    <Select 
                      value={recipientType} 
                      onValueChange={(value: any) => setRecipientType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis penerima" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Pelanggan</SelectItem>
                        <SelectItem value="selected">Pelanggan Terpilih</SelectItem>
                        <SelectItem value="filtered">Filter Pelanggan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {recipientType === 'filtered' && (
                    <Card className="border-dashed">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Filter Pelanggan</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="last-order-days">Pesanan dalam X hari terakhir</Label>
                            <Input 
                              id="last-order-days" 
                              type="number" 
                              placeholder="hari" 
                              min="1"
                              value={lastOrderDays || ''}
                              onChange={e => setLastOrderDays(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="min-order-count">Minimal jumlah pesanan</Label>
                            <Input 
                              id="min-order-count" 
                              type="number" 
                              placeholder="jumlah" 
                              min="1"
                              value={minOrderCount || ''}
                              onChange={e => setMinOrderCount(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="min-total-spent">Minimal total pembelian (Rp)</Label>
                          <Input 
                            id="min-total-spent" 
                            type="number" 
                            placeholder="dalam Rupiah" 
                            min="10000"
                            step="10000"
                            value={minTotalSpent || ''}
                            onChange={e => setMinTotalSpent(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="message">Pesan</Label>
                      <div className="text-sm text-muted-foreground">
                        Gunakan {'{name}'} untuk menyertakan nama pelanggan
                      </div>
                    </div>
                    <Textarea 
                      id="message" 
                      placeholder="Ketik pesan Anda di sini..." 
                      rows={8} 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Template Pesan</Label>
                    <div className="flex flex-wrap gap-2">
                      {messageTemplates.map((template, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          size="sm"
                          onClick={() => useMessageTemplate(template.content)}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="include-name" 
                      checked={includeName}
                      onCheckedChange={setIncludeName}
                    />
                    <Label htmlFor="include-name">Sertakan nama pelanggan dalam pesan</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="schedule" 
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                    <Label htmlFor="schedule">Jadwalkan pengiriman</Label>
                  </div>
                  
                  {isScheduled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="schedule-date">Tanggal</Label>
                        <Input 
                          id="schedule-date" 
                          type="date" 
                          value={scheduleDate}
                          onChange={e => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="schedule-time">Waktu</Label>
                        <Input 
                          id="schedule-time" 
                          type="time" 
                          value={scheduleTime}
                          onChange={e => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setMessage('')}>
                    Reset
                  </Button>
                  <Button 
                    onClick={handleSendBroadcast}
                    disabled={isSending || !message.trim() || (recipientType === 'selected' && selectedCustomers.length === 0)}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : isScheduled ? (
                      <>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Jadwalkan
                      </>
                    ) : (
                      <>
                        <Megaphone className="mr-2 h-4 w-4" />
                        Kirim Broadcast
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Panel Pelanggan */}
              {recipientType === 'selected' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pilih Pelanggan</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={selectAllCustomers}
                      >
                        Pilih Semua
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetCustomerSelection}
                      >
                        Reset
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {customers.map(customer => (
                            <div 
                              key={customer.id} 
                              className={`p-2 rounded-md flex items-center space-x-2 ${
                                selectedCustomers.includes(customer.id) 
                                  ? 'bg-muted/80' 
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => toggleCustomerSelection(customer.id)}
                            >
                              <Checkbox 
                                checked={selectedCustomers.includes(customer.id)} 
                                onCheckedChange={() => toggleCustomerSelection(customer.id)}
                              />
                              <div className="flex-1 truncate">
                                <div className="font-medium truncate">
                                  {customer.name || 'Tanpa Nama'}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {customer.phone}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="w-full text-center">
                      {selectedCustomers.length} pelanggan dipilih
                    </div>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Broadcast</CardTitle>
                <CardDescription>
                  Histori pesan broadcast yang telah dikirim
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Pesan</TableHead>
                        <TableHead>Penerima</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map(broadcast => (
                        <TableRow key={broadcast.id}>
                          <TableCell>
                            {new Date(broadcast.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {broadcast.message_template}
                          </TableCell>
                          <TableCell>
                            {broadcast.recipient_count} penerima
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              broadcast.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : broadcast.status === 'sending' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : broadcast.status === 'scheduled'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-red-100 text-red-800'
                            }>
                              {broadcast.status === 'completed' 
                                ? 'Selesai' 
                                : broadcast.status === 'sending' 
                                  ? 'Mengirim'
                                  : broadcast.status === 'scheduled'
                                    ? 'Terjadwal'
                                    : 'Gagal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Tidak ada riwayat broadcast</p>
                  </div>
                )}
              </CardContent>
              {history.length > 0 && (
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                    disabled={historyPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Halaman {historyPage}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setHistoryPage(historyPage + 1)}
                    disabled={history.length < 10}
                  >
                    Selanjutnya
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
