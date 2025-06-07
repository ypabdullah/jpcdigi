
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
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShippingMethod } from "@/data/models";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import { Plus, Edit, Trash } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
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

// Define the form schema
const shippingFormSchema = z.object({
  name: z.string().min(1, { message: "Nama wajib diisi" }),
  carrier: z.string().min(1, { message: "Kurir wajib diisi" }),
  cost: z.number().min(0, { message: "Biaya harus berupa angka positif" }),
  estimated_days: z.number().int().min(1, { message: "Estimasi Jam minimal 1" }),
  active: z.boolean().default(true)
});

export function ShippingPage() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<ShippingMethod | null>(null);

  const form = useForm({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      name: "",
      carrier: "",
      cost: 0,
      estimated_days: 1,
      active: true
    }
  });

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('name');

      if (error) throw error;
      setShippingMethods(data || []);
    } catch (error: any) {
      console.error("Error fetching shipping methods:", error);
      toast({
        title: "Error memuat metode pengiriman",
        description: error.message || "Silakan coba lagi nanti",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdit = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method);
      setIsEditing(true);
      setIsAdding(false);
      form.reset({
        name: method.name,
        carrier: method.carrier,
        cost: method.cost,
        estimated_days: method.estimated_days,
        active: method.active !== undefined ? method.active : true
      });
    } else {
      setEditingMethod(null);
      setIsAdding(true);
      setIsEditing(false);
      form.reset({
        name: "",
        carrier: "",
        cost: 0,
        estimated_days: 1,
        active: true
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof shippingFormSchema>) => {
    try {
      if (isEditing && editingMethod) {
        // Update existing shipping method
        const { error } = await supabase
          .from('shipping_methods')
          .update({
            name: values.name,
            carrier: values.carrier,
            cost: values.cost,
            estimated_days: values.estimated_days,
            active: values.active
          })
          .eq('id', editingMethod.id);
          
        if (error) throw error;
        
        toast({
          title: "Metode pengiriman diperbarui",
          description: `${values.name} telah diperbarui berhasil.`
        });
      } else if (isAdding) {
        // Create new shipping method
        const { error } = await supabase
          .from('shipping_methods')
          .insert({
            name: values.name,
            carrier: values.carrier,
            cost: values.cost,
            estimated_days: values.estimated_days,
            active: values.active
          });
          
        if (error) throw error;
        
        toast({
          title: "Metode pengiriman ditambahkan",
          description: `${values.name} telah ditambahkan berhasil.`
        });
      }
      
      setIsEditing(false);
      setIsAdding(false);
      fetchShippingMethods();
    } catch (error: any) {
      console.error("Error saving shipping method:", error);
      toast({
        title: "Error menyimpan metode pengiriman",
        description: error.message || "Silakan coba lagi nanti",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (method: ShippingMethod) => {
    setMethodToDelete(method);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!methodToDelete) return;
    
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', methodToDelete.id);
        
      if (error) throw error;
      
      toast({
        title: "Metode pengiriman dihapus",
        description: "Metode pengiriman telah dihapus berhasil."
      });
      
      setIsDeleteDialogOpen(false);
      fetchShippingMethods();
    } catch (error: any) {
      console.error("Error deleting shipping method:", error);
      toast({
        title: "Error menghapus metode pengiriman",
        description: error.message || "Silakan coba lagi nanti",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Metode Pengiriman</h1>
        <Button onClick={() => handleAddEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Metode
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Estimasi Jam</TableHead>
                <TableHead className="text-right">Biaya</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Memuat metode pengiriman...
                  </TableCell>
                </TableRow>
              ) : shippingMethods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Tidak ada metode pengiriman ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                shippingMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{method.carrier}</TableCell>
                    <TableCell className="text-center">{method.estimated_days} Jam</TableCell>
                    <TableCell className="text-right">{formatRupiah(method.cost)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddEdit(method)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(method)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add/Edit Shipping Method Sheet */}
      <Sheet open={isEditing || isAdding} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false);
          setIsAdding(false);
        }
      }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {isEditing ? "Edit Metode Pengiriman" : "Tambah Metode Pengiriman"}
            </SheetTitle>
          </SheetHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kurir</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biaya (Rp)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}

                
                name="estimated_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimasi Jam</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Aktif</FormLabel>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditing(false);
                  setIsAdding(false);
                }}>
                  Batal
                </Button>
                <Button type="submit">Simpan Metode</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus metode pengiriman ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
