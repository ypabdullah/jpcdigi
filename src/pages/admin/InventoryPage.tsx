
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
import { Product, InventoryTransaction } from "@/data/models";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Search, Plus, Package, Edit, Trash } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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

// Define schemas for our forms
const inventoryFormSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(["restock", "sale", "return", "adjustment"]),
  notes: z.string().optional()
});

const productFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  type: z.string().min(1, "Tipe wajib diisi"),
  price: z.number().min(0, "Harga harus berupa angka positif"),
  description: z.string().optional(),
  origin: z.string().optional(),
  seller: z.string().optional(),
  in_stock: z.boolean().default(true),
  featured: z.boolean().default(false),
  discount: z.number().min(0).max(100).optional()
});

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form for inventory transactions
  const inventoryForm = useForm({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      quantity: 0,
      type: "restock" as const,
      notes: ""
    }
  });

  // Form for product creation/editing
  const productForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      type: "",
      price: 0,
      description: "",
      origin: "",
      seller: "",
      in_stock: true,
      featured: false,
      discount: 0
    }
  });

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('products').select('*', { count: 'exact' });
      
      // Add search functionality if a search term is provided
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;
      
      setProducts(data as unknown as Product[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error memuat produk",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInventory = (product: Product) => {
    setSelectedProduct(product);
    setIsAddingInventory(true);
    inventoryForm.reset({
      quantity: 0,
      type: "restock" as const,
      notes: ""
    });
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsAddingProduct(true);
    productForm.reset({
      name: "",
      type: "",
      price: 0,
      description: "",
      origin: "",
      seller: "",
      in_stock: true,
      featured: false,
      discount: 0
    });
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditingProduct(true);
    productForm.reset({
      name: product.name,
      type: product.type,
      price: product.price,
      description: product.description || "",
      origin: product.origin || "",
      seller: product.seller || "",
      in_stock: product.in_stock || false,
      featured: product.featured || false,
      discount: product.discount || 0
    });
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
        
      if (error) throw error;
      
      toast({
        title: "Produk dihapus",
        description: "Produk telah dihapus berhasil."
      });
      
      setIsDeleteDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error menghapus produk",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
    }
  };

  const onSubmitInventory = async (values: z.infer<typeof inventoryFormSchema>) => {
    if (!selectedProduct) return;
    
    try {
      // Add inventory transaction
      const transaction: InventoryTransaction = {
        id: '', // Will be generated by Supabase
        product_id: selectedProduct.id,
        quantity: values.quantity,
        transaction_type: values.type as 'restock' | 'sale' | 'return' | 'adjustment',
        notes: values.notes || undefined,
        created_by: null // We could set this to the current user's ID if needed
      };
      
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert(transaction);
        
      if (transactionError) throw transactionError;
      
      // Update product in-stock status if needed
      if (values.type === "restock" && values.quantity > 0 && !selectedProduct.in_stock) {
        await supabase
          .from('products')
          .update({ in_stock: true })
          .eq('id', selectedProduct.id);
      }
      
      toast({
        title: "Inventaris diperbarui",
        description: `${values.quantity} unit ${values.type === 'restock' ? 'ditambahkan ke' : 'disesuaikan di'} inventaris.`,
      });
      
      setIsAddingInventory(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error memperbarui inventaris:", error);
      toast({
        title: "Error memperbarui inventaris",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
    }
  };

  const onSubmitProduct = async (values: z.infer<typeof productFormSchema>) => {
    try {
      if (isEditingProduct && selectedProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: values.name,
            type: values.type,
            price: values.price,
            description: values.description || null,
            origin: values.origin || null,
            seller: values.seller || null,
            in_stock: values.in_stock,
            featured: values.featured,
            discount: values.discount || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedProduct.id);
          
        if (error) throw error;
        
        toast({
          title: "Produk diperbarui",
          description: "Produk telah diperbarui berhasil."
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            name: values.name,
            type: values.type,
            price: values.price,
            description: values.description || null,
            origin: values.origin || null,
            seller: values.seller || null,
            in_stock: values.in_stock,
            featured: values.featured,
            discount: values.discount || null,
            images: [] // Default empty array for images
          });
          
        if (error) throw error;
        
        toast({
          title: "Produk ditambahkan",
          description: "Produk baru telah ditambahkan berhasil."
        });
      }
      
      setIsAddingProduct(false);
      setIsEditingProduct(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error menyimpan produk:", error);
      toast({
        title: "Error menyimpan produk",
        description: error.message || "Silakan coba lagi nanti.",
        variant: "destructive"
      });
    }
  };
  
  // Filter products based on search term
  const filteredProducts = searchTerm ? 
    products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.type.toLowerCase().includes(searchTerm.toLowerCase())
    ) : products;

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Inventaris</h1>
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>
      
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Cari produk..." 
            className="pl-10" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Gambar</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-center">Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Memuat produk...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Tidak ada produk ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 relative rounded overflow-hidden">
                      <AspectRatio ratio={1/1}>
                        <img 
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="object-cover"
                        />
                      </AspectRatio>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.type}</TableCell>
                  <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.in_stock ? 'Tersedia' : 'Stok habis'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddInventory(product)}
                      className="mr-2"
                    >
                      <Package className="h-4 w-4 mr-1" /> Kelola Stok
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="mr-2"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash className="h-4 w-4" /> Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}
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
      
      {/* Inventory Management Sheet */}
      <Sheet open={isAddingInventory} onOpenChange={setIsAddingInventory}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Perbarui Inventaris</SheetTitle>
            <SheetDescription>
              Perbarui inventaris untuk {selectedProduct?.name}
            </SheetDescription>
          </SheetHeader>
          
          <Form {...inventoryForm}>
            <form onSubmit={inventoryForm.handleSubmit(onSubmitInventory)} className="space-y-6 py-6">
              <FormField
                control={inventoryForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
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
                control={inventoryForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Transaksi</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                        {...field}
                      >
                        <option value="restock">Pengisian Stok</option>
                        <option value="sale">Penjualan</option>
                        <option value="return">Pengembalian</option>
                        <option value="adjustment">Penyesuaian</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={inventoryForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingInventory(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan Perubahan</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Product Form Sheet */}
      <Sheet open={isAddingProduct || isEditingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsAddingProduct(false);
          setIsEditingProduct(false);
        }
      }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {isEditingProduct ? "Edit Produk" : "Tambah Produk"}
            </SheetTitle>
          </SheetHeader>
          
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-6 py-6">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Produk</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asal</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={productForm.control}
                  name="seller"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penjual</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="in_stock"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Tersedia</FormLabel>
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
                
                <FormField
                  control={productForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Unggulan</FormLabel>
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
              </div>
              
              <FormField
                control={productForm.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diskon (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddingProduct(false);
                  setIsEditingProduct(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">Simpan Produk</Button>
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
              Apakah Anda yakin ingin menghapus {selectedProduct?.name}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
