import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Voucher } from "@/data/models";
import { VoucherService } from "@/integrations/voucher/service";
import { seedVouchers, checkVouchersTable } from "@/integrations/voucher/seed";
import { Tag, PlusCircle, Search, Edit, Trash2, AlertCircle, Database } from "lucide-react";
import { format } from "date-fns";
import { formatRupiah } from "@/lib/utils";

export function VoucherPage() {
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasTable, setHasTable] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Voucher>>({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_purchase: undefined,
    max_discount: undefined,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: undefined,
    is_active: true,
    description: ""
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    fetchVouchers();
    checkTableExists();
  }, [searchQuery, showActiveOnly]);
  
  const checkTableExists = async () => {
    const exists = await checkVouchersTable();
    setHasTable(exists);
  };
  
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await VoucherService.getVouchers(100, 0, {
        search: searchQuery || undefined,
        is_active: showActiveOnly ? true : undefined
      });
      
      if (error) {
        throw error;
      }
      
      setVouchers(data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setHasTable(false);
      toast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat memuat daftar voucher",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleAddNew = () => {
    resetForm();
    setIsEditMode(false);
    setDialogOpen(true);
  };
  
  const handleEdit = (voucher: Voucher) => {
    setFormData({
      ...voucher,
      start_date: new Date(voucher.start_date).toISOString().split('T')[0],
      end_date: new Date(voucher.end_date).toISOString().split('T')[0],
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: undefined,
      max_discount: undefined,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usage_limit: undefined,
      is_active: true,
      description: ""
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditMode && formData.id) {
        // Update existing voucher
        const { data, error } = await VoucherService.updateVoucher(formData.id, formData);
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Voucher Diperbarui",
          description: `Voucher dengan kode ${formData.code} berhasil diperbarui`,
          variant: "default"
        });
      } else {
        // Add new voucher
        const { data, error } = await VoucherService.addVoucher(formData);
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "Voucher Ditambahkan",
          description: `Voucher baru dengan kode ${formData.code} berhasil ditambahkan`,
          variant: "default"
        });
      }
      
      // Close dialog and refresh data
      setDialogOpen(false);
      fetchVouchers();
    } catch (error: any) {
      console.error("Error saving voucher:", error);
      toast({
        title: "Gagal Menyimpan",
        description: error.message || "Terjadi kesalahan saat menyimpan voucher",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteVoucher = async () => {
    if (!voucherToDelete) return;
    
    try {
      const { error } = await VoucherService.deleteVoucher(voucherToDelete);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Voucher Dihapus",
        description: "Voucher berhasil dihapus dari sistem",
        variant: "default"
      });
      
      // Refresh data
      fetchVouchers();
      setVoucherToDelete(null);
    } catch (error: any) {
      console.error("Error deleting voucher:", error);
      toast({
        title: "Gagal Menghapus",
        description: error.message || "Terjadi kesalahan saat menghapus voucher",
        variant: "destructive"
      });
    }
  };
  
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await VoucherService.toggleVoucherStatus(id, !currentStatus);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: `Voucher ${currentStatus ? "Dinonaktifkan" : "Diaktifkan"}`,
        description: `Status voucher berhasil diubah menjadi ${currentStatus ? "tidak aktif" : "aktif"}`,
        variant: "default"
      });
      
      // Refresh data
      fetchVouchers();
    } catch (error: any) {
      console.error("Error toggling voucher status:", error);
      toast({
        title: "Gagal Mengubah Status",
        description: error.message || "Terjadi kesalahan saat mengubah status voucher",
        variant: "destructive"
      });
    }
  };
  
  const getStatusBadge = (voucher: Voucher) => {
    if (!voucher.is_active) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Tidak Aktif</span>;
    }
    
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    
    if (now < startDate) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Belum Mulai</span>;
    }
    
    if (now > endDate) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Kadaluarsa</span>;
    }
    
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Habis</span>;
    }
    
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Aktif</span>;
  };
  
  const handleInitializeData = async () => {
    setIsSeeding(true);
    try {
      await seedVouchers();
      toast({
        title: "Berhasil",
        description: "Data voucher contoh berhasil ditambahkan ke database",
        variant: "default",
      });
      fetchVouchers();
      checkTableExists();
    } catch (error) {
      console.error("Error initializing data:", error);
      toast({
        title: "Gagal Menginisialisasi Data",
        description: "Terjadi kesalahan saat menambahkan data contoh",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manajemen Voucher</h1>
          <div className="flex gap-2">
            {!hasTable && (
              <Button 
                onClick={handleInitializeData} 
                disabled={isSeeding}
                variant="outline"
              >
                <Database className="mr-2 h-4 w-4" />
                {isSeeding ? "Menginisialisasi..." : "Inisialisasi Data"}
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Voucher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Voucher" : "Tambah Voucher Baru"}</DialogTitle>
                  <DialogDescription>
                    {isEditMode 
                      ? "Perbarui informasi voucher yang sudah ada" 
                      : "Isi formulir berikut untuk menambahkan voucher baru"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="code" className="text-right">
                        Kode Voucher*
                      </Label>
                      <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="discount_type" className="text-right">
                        Tipe Diskon*
                      </Label>
                      <Select
                        name="discount_type"
                        value={formData.discount_type}
                        onValueChange={(value) => handleSelectChange("discount_type", value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Pilih tipe diskon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                          <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="discount_value" className="text-right">
                        Nilai Diskon*
                      </Label>
                      <div className="col-span-3 flex items-center">
                        <Input
                          id="discount_value"
                          name="discount_value"
                          type="number"
                          min={0}
                          value={formData.discount_value || ''}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="ml-2">
                          {formData.discount_type === "percentage" ? "%" : "Rupiah"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="min_purchase" className="text-right">
                        Min. Pembelian
                      </Label>
                      <Input
                        id="min_purchase"
                        name="min_purchase"
                        type="number"
                        min={0}
                        value={formData.min_purchase || ''}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="Opsional"
                      />
                    </div>
                    {formData.discount_type === "percentage" && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="max_discount" className="text-right">
                          Maks. Diskon
                        </Label>
                        <Input
                          id="max_discount"
                          name="max_discount"
                          type="number"
                          min={0}
                          value={formData.max_discount || ''}
                          onChange={handleInputChange}
                          className="col-span-3"
                          placeholder="Opsional"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="start_date" className="text-right">
                        Tanggal Mulai*
                      </Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="end_date" className="text-right">
                        Tanggal Berakhir*
                      </Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="usage_limit" className="text-right">
                        Batas Penggunaan
                      </Label>
                      <Input
                        id="usage_limit"
                        name="usage_limit"
                        type="number"
                        min={0}
                        value={formData.usage_limit || ''}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="Opsional"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Deskripsi
                      </Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="Opsional"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="is_active" className="text-right">
                        Status Aktif
                      </Label>
                      <div className="flex items-center space-x-2 col-span-3">
                        <Switch 
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                        />
                        <Label htmlFor="is_active">
                          {formData.is_active ? "Aktif" : "Tidak Aktif"}
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {isEditMode ? "Perbarui Voucher" : "Tambah Voucher"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              <span>Daftar Voucher</span>
            </CardTitle>
            <CardDescription>
              Kelola voucher diskon untuk pelanggan
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Cari kode atau deskripsi voucher..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="active-filter"
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                />
                <Label htmlFor="active-filter">Hanya Tampilkan Voucher Aktif</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-flame-500"></div>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">Tidak Ada Voucher</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  {searchQuery || showActiveOnly 
                    ? "Tidak ada voucher yang sesuai dengan filter yang dipilih"
                    : "Belum ada voucher yang ditambahkan. Klik tombol 'Tambah Voucher' untuk mulai membuat voucher"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Kode</TableHead>
                      <TableHead>Diskon</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Batasan</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Penggunaan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((voucher) => (
                      <TableRow key={voucher.id}>
                        <TableCell className="font-medium">
                          {voucher.code}
                          {voucher.description && (
                            <p className="text-xs text-gray-500 mt-1">{voucher.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {voucher.discount_type === "percentage" 
                            ? `${voucher.discount_value}%` 
                            : formatRupiah(voucher.discount_value)
                          }
                          {voucher.discount_type === "percentage" && voucher.max_discount && (
                            <p className="text-xs text-gray-500 mt-1">
                              Maks: {formatRupiah(voucher.max_discount)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span>{format(new Date(voucher.start_date), "dd/MM/yyyy")}</span>
                            <span> - </span>
                            <span>{format(new Date(voucher.end_date), "dd/MM/yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {voucher.min_purchase && (
                            <div className="text-sm">
                              Min: {formatRupiah(voucher.min_purchase)}
                            </div>
                          )}
                          {voucher.usage_limit && (
                            <div className="text-sm">
                              Maks: {voucher.usage_limit} kali
                            </div>
                          )}
                          {!voucher.min_purchase && !voucher.usage_limit && (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(voucher)}
                        </TableCell>
                        <TableCell className="text-center">
                          {voucher.usage_count || 0}
                          {voucher.usage_limit && (
                            <span> / {voucher.usage_limit}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleStatus(voucher.id, voucher.is_active)}
                            >
                              {voucher.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleEdit(voucher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                  onClick={() => setVoucherToDelete(voucher.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Voucher</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus voucher dengan kode <strong>{voucher.code}</strong>? Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setVoucherToDelete(null)}>
                                    Batal
                                  </AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteVoucher} className="bg-red-500 hover:bg-red-600">
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
