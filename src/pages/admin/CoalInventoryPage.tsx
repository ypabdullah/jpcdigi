import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { CoalInventoryTransaction, CoalInventorySummary } from "@/data/models";
import { CoalInventoryService } from "@/integrations/coal-inventory/service";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  ArrowDown, 
  ArrowUp, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Truck,
  AlertCircle,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { format, subDays } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { id as idLocale } from 'date-fns/locale';

// Define schemas for our forms
const coalTransactionFormSchema = z.object({
  transaction_date: z.string().nonempty("Tanggal transaksi wajib diisi"),
  transaction_type: z.enum(["incoming", "outgoing"]),
  quantity_kg: z.number().positive("Jumlah harus lebih dari 0"),
  source_destination: z.string().nonempty("Sumber/tujuan wajib diisi"),
  vehicle_info: z.string().optional(),
  driver_name: z.string().optional(),
  price_per_kg: z.number().optional(),
  quality_grade: z.enum(["premium", "standard", "economy"]),
  moisture_content: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  document_reference: z.string().optional()
});

type CoalTransactionFormValues = z.infer<typeof coalTransactionFormSchema>;

// Default empty summary data
const emptySummary: CoalInventorySummary = {
  total_incoming_kg: 0,
  total_outgoing_kg: 0,
  current_stock_kg: 0,
  average_price_per_kg: 0,
  last_transaction_date: new Date().toISOString(),
  stock_value: 0,
  premium_stock_kg: 0,
  standard_stock_kg: 0,
  economy_stock_kg: 0
};

export function CoalInventoryPage() {
  const { user, profile } = useAuth();
  const [summary, setSummary] = useState<CoalInventorySummary>(emptySummary);
  const [transactions, setTransactions] = useState<CoalInventoryTransaction[]>([]);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<CoalInventoryTransaction | null>(null);
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Form for inventory transactions
  const transactionForm = useForm<CoalTransactionFormValues>({
    resolver: zodResolver(coalTransactionFormSchema),
    defaultValues: {
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      transaction_type: "incoming",
      quantity_kg: 0,
      source_destination: "",
      vehicle_info: "",
      driver_name: "",
      price_per_kg: 0,
      quality_grade: "standard",
      moisture_content: 0,
      notes: "",
      document_reference: ""
    }
  });

  // Fungsi untuk fetch semua transaksi inventory dari Supabase
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data: transactions, error: transactionError } = await CoalInventoryService.getTransactions(100, 0);
      
      if (transactionError) {
        throw transactionError;
      }
      
      if (transactions) {
        setTransactions(transactions);
      }
      
      // Fetch summary data
      const { data: summary, error: summaryError } = await CoalInventoryService.getSummary();
      
      if (summaryError) {
        throw summaryError;
      }
      
      if (summary) {
        setSummary(summary);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data transaksi stok arang',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect untuk fetch data saat komponen di-mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fungsi untuk menambah transaksi baru
  const handleAddTransaction = async (values: z.infer<typeof coalTransactionFormSchema>) => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        throw new Error('User ID tidak ditemukan. Silahkan login ulang.');
      }
      
      // Tambahkan user ID sebagai created_by
      const newTransaction: Partial<CoalInventoryTransaction> = {
        ...values,
        created_by: user.id,
        created_at: new Date().toISOString(),
        // Hitung total amount jika ada price_per_kg
        total_amount: values.price_per_kg ? values.price_per_kg * values.quantity_kg : undefined
      };
      
      console.log('Mengirim data transaksi:', newTransaction);
      
      const { data, error } = await CoalInventoryService.addTransaction(newTransaction);
      
      if (error) {
        console.error('Error dari service:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Tidak ada data yang dikembalikan setelah menambahkan transaksi');
      }
      
      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil ditambahkan',
        variant: 'default'
      });
      
      // Reset form dan refresh data
      transactionForm.reset();
      setIsAddingTransaction(false);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: error?.message || error?.error_description || 'Gagal menambahkan transaksi. Silahkan cek konsol untuk detail lebih lanjut.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk mengedit transaksi
  const handleEditTransaction = async (values: z.infer<typeof coalTransactionFormSchema>) => {
    if (!selectedTransaction) return;
    
    try {
      setIsLoading(true);
      
      // Update transaksi
      const updatedTransaction: Partial<CoalInventoryTransaction> = {
        ...values,
        // Hitung total amount jika ada price_per_kg
        total_amount: values.price_per_kg ? values.price_per_kg * values.quantity_kg : undefined
      };
      
      const { error } = await CoalInventoryService.updateTransaction(selectedTransaction.id, updatedTransaction);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil diperbarui',
        variant: 'default'
      });
      
      // Reset form dan refresh data
      transactionForm.reset();
      setIsEditingTransaction(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui transaksi',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk menghapus transaksi
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await CoalInventoryService.deleteTransaction(selectedTransaction.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil dihapus',
        variant: 'default'
      });
      
      setIsConfirmDeleteOpen(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk memulai edit transaksi
  const startEditTransaction = (transaction: CoalInventoryTransaction) => {
    setSelectedTransaction(transaction);
    transactionForm.reset({
      transaction_date: transaction.transaction_date.substring(0, 10), // YYYY-MM-DD format
      transaction_type: transaction.transaction_type as "incoming" | "outgoing",
      quantity_kg: transaction.quantity_kg,
      source_destination: transaction.source_destination,
      vehicle_info: transaction.vehicle_info || '',
      driver_name: transaction.driver_name || '',
      price_per_kg: transaction.price_per_kg || 0,
      quality_grade: (transaction.quality_grade || 'standard') as "premium" | "standard" | "economy",
      moisture_content: transaction.moisture_content || 0,
      notes: transaction.notes || '',
      document_reference: transaction.document_reference || ''
    } as CoalTransactionFormValues);
    setIsEditingTransaction(true);
  };
  
  // Fungsi untuk memulai proses hapus transaksi
  const startDeleteTransaction = (transaction: CoalInventoryTransaction) => {
    setSelectedTransaction(transaction);
    setIsConfirmDeleteOpen(true);
  };
  
  // Filter transactions based on search term and transaction type
  const filteredTransactions = transactions
    .filter(transaction => {
      if (searchTerm === "") return true;
      return (
        transaction.source_destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.document_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .filter(transaction => {
      if (transactionType === 'all') return true;
      return transaction.transaction_type === transactionType;
    })
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

  // Calculate pagination
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Handle preparing a new transaction form
  const prepareNewTransactionForm = () => {
    setIsAddingTransaction(true);
    transactionForm.reset({
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      transaction_type: "incoming",
      quantity_kg: 0,
      source_destination: "",
      vehicle_info: "",
      driver_name: "",
      price_per_kg: 0,
      quality_grade: "standard",
      moisture_content: 0,
      notes: "",
      document_reference: ""
    } as CoalTransactionFormValues);
  };

  // Handle form submission
  const onSubmitTransaction = async (values: z.infer<typeof coalTransactionFormSchema>) => {
    try {
      if (isEditingTransaction && selectedTransaction) {
        // Jika sedang edit, panggil fungsi edit
        await handleEditTransaction(values);
      } else {
        // Jika menambah baru, panggil fungsi add
        await handleAddTransaction(values);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  };

  // Dialog konfirmasi hapus
  const renderDeleteConfirmDialog = () => (
    <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus Transaksi</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsConfirmDeleteOpen(false)}
          >
            Batal
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeleteTransaction}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Hapus Transaksi'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Render form dalam Sheet untuk tambah/edit transaksi
  const renderTransactionForm = () => (
    <Sheet open={isAddingTransaction || isEditingTransaction} onOpenChange={(open) => {
      if (!open) {
        setIsAddingTransaction(false);
        setIsEditingTransaction(false);
        setSelectedTransaction(null);
        transactionForm.reset();
      }
    }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</SheetTitle>
          <SheetDescription>
            {isEditingTransaction 
              ? 'Edit detail transaksi stok arang yang ada' 
              : 'Isi form berikut untuk mencatat transaksi stok arang baru'}
          </SheetDescription>
        </SheetHeader>

        <Form {...transactionForm}>
          <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4 py-4">
            <FormField
              control={transactionForm.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Transaksi</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="transaction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Transaksi</FormLabel>
                  <FormControl>
                    <select
                      className="w-full p-2 border rounded-md"
                      {...field}
                    >
                      <option value="incoming">Pemasukan Stok</option>
                      <option value="outgoing">Pengeluaran Stok</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="quantity_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Masukkan jumlah dalam kg"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="source_destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sumber/Tujuan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan sumber atau tujuan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="quality_grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kualitas Arang</FormLabel>
                  <FormControl>
                    <select
                      className="w-full p-2 border rounded-md"
                      {...field}
                    >
                      <option value="premium">Premium</option>
                      <option value="standard">Standar</option>
                      <option value="economy">Ekonomis</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="vehicle_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Info Kendaraan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Truk Fuso AB 1234 CD"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="driver_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sopir</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan nama sopir"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="price_per_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga per kg</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Masukkan harga per kg"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="moisture_content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kadar Air (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Masukkan kadar air"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="document_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. Referensi Dokumen</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: INV-20250530-001"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={transactionForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tambahkan catatan jika diperlukan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditingTransaction ? 'Menyimpan...' : 'Menambahkan...'}
                  </>
                ) : (
                  isEditingTransaction ? 'Simpan Perubahan' : 'Tambah Transaksi'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manajemen Stok Arang</h1>
          <Button onClick={prepareNewTransactionForm}>
            <Plus className="h-4 w-4 mr-2" /> Catat Transaksi Baru
          </Button>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Stok Arang Saat Ini</CardTitle>
              <CardDescription>Total seluruh jenis arang</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.current_stock_kg.toLocaleString()} kg</div>
              <div className="mt-2 text-sm text-gray-500">
                Nilai stok: {formatRupiah(summary.stock_value)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Rekapitulasi Arang</CardTitle>
              <CardDescription>Detail berdasarkan kualitas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Premium:</span>
                <span className="font-bold">{summary.premium_stock_kg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Standar:</span>
                <span className="font-bold">{summary.standard_stock_kg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ekonomis:</span>
                <span className="font-bold">{summary.economy_stock_kg.toLocaleString()} kg</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Aktivitas Transaksi</CardTitle>
              <CardDescription>Ringkasan aktivitas stok</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <ArrowDown className="h-4 w-4 text-green-500 mr-1" /> Pemasukan:</span>
                <span className="font-bold">{summary.total_incoming_kg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <ArrowUp className="h-4 w-4 text-red-500 mr-1" /> Pengeluaran:</span>
                <span className="font-bold">{summary.total_outgoing_kg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Transaksi terakhir:</span>
                <span className="font-bold">{format(new Date(summary.last_transaction_date), 'dd MMM yyyy', { locale: idLocale })}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari transaksi..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={transactionType === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionType('all')}
            >
              Semua
            </Button>
            <Button
              variant={transactionType === 'incoming' ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionType('incoming')}
              className="flex items-center"
            >
              <ArrowDown className="h-4 w-4 mr-1" /> Pemasukan
            </Button>
            <Button
              variant={transactionType === 'outgoing' ? "default" : "outline"}
              size="sm"
              onClick={() => setTransactionType('outgoing')}
              className="flex items-center"
            >
              <ArrowUp className="h-4 w-4 mr-1" /> Pengeluaran
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-md shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah (kg)</TableHead>
                <TableHead>Kualitas</TableHead>
                <TableHead>Sumber/Tujuan</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead className="text-right">Nilai</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Memuat transaksi...
                  </TableCell>
                </TableRow>
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Tidak ada transaksi ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: idLocale })}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.transaction_type === 'incoming' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transaction_type === 'incoming' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{transaction.quantity_kg.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.quality_grade === 'premium' 
                          ? 'bg-blue-100 text-blue-800' 
                          : transaction.quality_grade === 'standard'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.quality_grade === 'premium' 
                          ? 'Premium' 
                          : transaction.quality_grade === 'standard' 
                            ? 'Standar' 
                            : 'Ekonomis'}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.source_destination}</TableCell>
                    <TableCell>{transaction.vehicle_info || '-'}</TableCell>
                    <TableCell className="text-right">
                      {transaction.total_amount ? formatRupiah(transaction.total_amount) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startEditTransaction(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startDeleteTransaction(transaction)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!canGoPrevious}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={!canGoNext}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Form Sheet */}
        <Sheet open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Catat Transaksi Arang</SheetTitle>
              <SheetDescription>
                Catat pemasukan atau pengeluaran stok arang
              </SheetDescription>
            </SheetHeader>
            
            <Form {...transactionForm}>
              <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4 py-4">
                <FormField
                  control={transactionForm.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Transaksi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Transaksi</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="incoming">Pemasukan Arang</option>
                          <option value="outgoing">Pengeluaran Arang</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="quantity_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="quality_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kualitas Arang</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="premium">Premium</option>
                          <option value="standard">Standar</option>
                          <option value="economy">Ekonomis</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="source_destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {transactionForm.watch('transaction_type') === 'incoming' ? 'Sumber' : 'Tujuan'}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="vehicle_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Informasi Kendaraan</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="driver_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Supir</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="price_per_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga per kg (Rp)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="moisture_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kadar Air (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="document_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referensi Dokumen</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Transaksi'
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
        
        {/* Edit Transaction Form Sheet */}
        <Sheet open={isEditingTransaction} onOpenChange={setIsEditingTransaction}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Edit Transaksi Arang</SheetTitle>
              <SheetDescription>
                Perbarui informasi transaksi arang
              </SheetDescription>
            </SheetHeader>
            
            <Form {...transactionForm}>
              <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4 py-4">
                <FormField
                  control={transactionForm.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Transaksi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Transaksi</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="incoming">Pemasukan Arang</option>
                          <option value="outgoing">Pengeluaran Arang</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="quantity_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="quality_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kualitas Arang</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="premium">Premium</option>
                          <option value="standard">Standar</option>
                          <option value="economy">Ekonomis</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="source_destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {transactionForm.watch('transaction_type') === 'incoming' ? 'Sumber' : 'Tujuan'}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="vehicle_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Informasi Kendaraan</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="driver_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Supir</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="price_per_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga per kg (Rp)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="moisture_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kadar Air (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="document_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referensi Dokumen</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Perbarui Transaksi'
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
        
        {/* Render confirmation dialog */}
        {renderDeleteConfirmDialog()}
      </div>
    </AdminLayout>
  );
}
