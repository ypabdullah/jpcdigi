import { supabase } from '../supabase/client';
import { CoalInventoryTransaction, CoalInventorySummary } from '@/data/models';
import { v4 as uuidv4 } from 'uuid';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Service untuk mengelola stok arang
 */
// Interface untuk hasil operasi CRUD
interface CrudResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export const CoalInventoryService = {
  /**
   * Mengambil daftar transaksi stok arang
   * @param limit Jumlah maksimal data yang diambil
   * @param offset Offset untuk pagination
   * @param filters Filter tambahan (opsional)
   */
  async getTransactions(
    limit: number = 100, 
    offset: number = 0,
    filters?: {
      transaction_type?: 'incoming' | 'outgoing';
      from_date?: string;
      to_date?: string;
      search?: string;
    }
  ): Promise<CrudResult<CoalInventoryTransaction[]>> {
    try {
      let query = supabase
        .from('coal_inventory_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Tambahkan filter jika ada
      if (filters) {
        if (filters.transaction_type) {
          query = query.eq('transaction_type', filters.transaction_type);
        }
        
        if (filters.from_date) {
          query = query.gte('transaction_date', filters.from_date);
        }
        
        if (filters.to_date) {
          query = query.lte('transaction_date', filters.to_date);
        }
        
        if (filters.search) {
          query = query.or(`source_destination.ilike.%${filters.search}%,document_reference.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }
      }
      
      const { data, error } = await query;
      
      return { data: data as CoalInventoryTransaction[], error };
    } catch (error) {
      console.error('Error fetching coal inventory transactions:', error);
      return { data: null, error: error as Error };
    }
  },
  
  /**
   * Mengambil ringkasan stok arang
   */
  async getSummary(): Promise<CrudResult<CoalInventorySummary>> {
    try {
      const { data, error } = await supabase
        .from('coal_inventory_summary')
        .select('*')
        .single();
      
      return { data: data as CoalInventorySummary, error };
    } catch (error) {
      console.error('Error fetching coal inventory summary:', error);
      return { data: null, error: error as Error };
    }
  },
  
  /**
   * Menambahkan transaksi stok arang baru
   * @param transaction Data transaksi baru
   */
  async addTransaction(transaction: Partial<CoalInventoryTransaction>): Promise<CrudResult<CoalInventoryTransaction>> {
    try {
      // Validasi field yang diperlukan
      const requiredFields = ['transaction_date', 'transaction_type', 'quantity_kg', 'source_destination', 'created_by'];
      for (const field of requiredFields) {
        if (!transaction[field as keyof Partial<CoalInventoryTransaction>]) {
          throw new Error(`Field ${field} wajib diisi`);
        }
      }

      // Pastikan ID transaksi dibuat
      if (!transaction.id) {
        transaction.id = uuidv4();
      }
      
      // Pastikan created_at ada
      if (!transaction.created_at) {
        transaction.created_at = new Date().toISOString();
      }
      
      // Hitung total_amount jika ada price_per_kg
      if (transaction.price_per_kg && transaction.quantity_kg) {
        transaction.total_amount = transaction.price_per_kg * transaction.quantity_kg;
      }
      
      console.log('Menambahkan transaksi baru:', transaction);
      
      // Simpan transaksi ke database
      const { data, error } = await supabase
        .from('coal_inventory_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) {
        console.error('Database error saat menambahkan transaksi:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Tidak ada data yang dikembalikan setelah insert');
      }
      
      // Update ringkasan stok arang
      await this.updateInventorySummary();
      
      return { data: data as CoalInventoryTransaction, error: null };
    } catch (error) {
      console.error('Error adding coal inventory transaction:', error);
      return { data: null, error: error as Error };
    }
  },
  
  /**
   * Memperbarui transaksi stok arang
   * @param id ID transaksi yang akan diperbarui
   * @param transaction Data transaksi yang diperbarui
   */
  async updateTransaction(id: string, transaction: Partial<CoalInventoryTransaction>): Promise<CrudResult<CoalInventoryTransaction>> {
    try {
      // Hitung total_amount jika ada price_per_kg
      if (transaction.price_per_kg && transaction.quantity_kg) {
        transaction.total_amount = transaction.price_per_kg * transaction.quantity_kg;
      }
      
      // Perbarui transaksi di database
      const { data, error } = await supabase
        .from('coal_inventory_transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update ringkasan stok arang
      await this.updateInventorySummary();
      
      return { data: data as CoalInventoryTransaction, error: null };
    } catch (error) {
      console.error('Error updating coal inventory transaction:', error);
      return { data: null, error: error as Error };
    }
  },
  
  /**
   * Menghapus transaksi stok arang
   * @param id ID transaksi yang akan dihapus
   */
  async deleteTransaction(id: string): Promise<CrudResult<null>> {
    try {
      const { error } = await supabase
        .from('coal_inventory_transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update ringkasan stok arang
      await this.updateInventorySummary();
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting coal inventory transaction:', error);
      return { data: null, error: error as Error };
    }
  },
  /**
   * Mengurangi stok arang berdasarkan pesanan
   * @param orderId ID pesanan
   * @param items Item dalam pesanan
   * @param userId ID pengguna admin yang melakukan tindakan
   */
  async reduceStockFromOrder(
    orderId: string, 
    items: { productName: string; quantity: number }[], 
    userId: string
  ): Promise<boolean> {
    try {
      // Hitung total arang yang dipesan (dalam kg)
      const totalCoalOrdered = items.reduce((total, item) => {
        // Asumsi produk dengan 'arang' dalam nama adalah produk arang
        // Dan satuan quantity adalah dalam kg
        if (item.productName.toLowerCase().includes('arang')) {
          return total + item.quantity;
        }
        return total;
      }, 0);

      // Jika tidak ada arang yang dipesan, tidak perlu membuat transaksi
      if (totalCoalOrdered <= 0) {
        return true;
      }

      // Buat transaksi pengurangan stok
      const transaction: Partial<CoalInventoryTransaction> = {
        id: uuidv4(),
        transaction_date: new Date().toISOString(),
        transaction_type: 'outgoing',
        quantity_kg: totalCoalOrdered,
        source_destination: `Order #${orderId.substring(0, 8)}`,
        notes: `Pengurangan stok otomatis untuk pesanan #${orderId.substring(0, 8)}`,
        created_by: userId,
        created_at: new Date().toISOString(),
        document_reference: orderId
      };

      // Simpan transaksi ke database
      const { error } = await supabase
        .from('coal_inventory_transactions')
        .insert(transaction);

      if (error) {
        console.error('Error reducing coal stock:', error);
        return false;
      }

      // Update ringkasan stok arang
      await this.updateInventorySummary();
      return true;
    } catch (error) {
      console.error('Error in reduceStockFromOrder:', error);
      return false;
    }
  },

  /**
   * Menambahkan kembali stok arang ketika pesanan dibatalkan
   * @param orderId ID pesanan
   * @param items Item dalam pesanan
   * @param userId ID pengguna admin yang melakukan tindakan
   */
  async restoreStockFromCancelledOrder(
    orderId: string, 
    items: { productName: string; quantity: number }[], 
    userId: string
  ): Promise<boolean> {
    try {
      // Hitung total arang yang dibatalkan (dalam kg)
      const totalCoalCancelled = items.reduce((total, item) => {
        // Asumsi produk dengan 'arang' dalam nama adalah produk arang
        if (item.productName.toLowerCase().includes('arang')) {
          return total + item.quantity;
        }
        return total;
      }, 0);

      // Jika tidak ada arang yang dibatalkan, tidak perlu membuat transaksi
      if (totalCoalCancelled <= 0) {
        return true;
      }

      // Periksa apakah sudah ada transaksi pengurangan stok sebelumnya
      const { data: existingTransactions } = await supabase
        .from('coal_inventory_transactions')
        .select('*')
        .eq('document_reference', orderId)
        .eq('transaction_type', 'outgoing');

      // Jika tidak ada transaksi pengurangan sebelumnya, tidak perlu menambahkan kembali
      if (!existingTransactions || existingTransactions.length === 0) {
        console.log(`No previous stock reduction found for order ${orderId}`);
        return true;
      }

      // Buat transaksi penambahan stok dari order yang dibatalkan
      // Kita gunakan tipe khusus 'cancelled_order_return' untuk membedakannya dari pemasukan biasa
      const transaction: Partial<CoalInventoryTransaction> = {
        id: uuidv4(),
        transaction_date: new Date().toISOString(),
        // Secara UI masih 'incoming', tapi kita tambahkan metadata untuk membedakannya
        transaction_type: 'incoming',
        quantity_kg: totalCoalCancelled,
        source_destination: `Cancelled Order #${orderId.substring(0, 8)}`,
        notes: `Pengembalian stok otomatis untuk pesanan #${orderId.substring(0, 8)} yang dibatalkan`,
        created_by: userId,
        created_at: new Date().toISOString(),
        document_reference: orderId,
        // Tambahkan metadata untuk menandai ini adalah pengembalian dari order yang dibatalkan
        quality_grade: 'standard', // Default ke standard jika tidak diketahui
        vehicle_info: 'cancelled_order_return' // Kita gunakan field ini sebagai flag
      };

      // Simpan transaksi ke database
      const { error } = await supabase
        .from('coal_inventory_transactions')
        .insert(transaction);

      if (error) {
        console.error('Error restoring coal stock:', error);
        return false;
      }

      // Update ringkasan stok arang
      await this.updateInventorySummary();
      return true;
    } catch (error) {
      console.error('Error in restoreStockFromCancelledOrder:', error);
      return false;
    }
  },

  /**
   * Memperbarui ringkasan stok arang berdasarkan semua transaksi
   */
  async updateInventorySummary(): Promise<void> {
    try {
      // Ambil semua transaksi
      const { data: transactions, error } = await supabase
        .from('coal_inventory_transactions')
        .select('*')
        .order('transaction_date', { ascending: true });

      if (error) {
        console.error('Error fetching coal transactions:', error);
        return;
      }

      if (!transactions || transactions.length === 0) {
        return;
      }

      // Hitung total pemasukan dan pengeluaran
      let totalIncoming = 0;
      let totalOutgoing = 0;
      let totalPremium = 0;
      let totalStandard = 0;
      let totalEconomy = 0;
      let totalValue = 0;
      let totalValueItems = 0;
      let lastTransactionDate = '';

      // Variabel untuk melacak stok dari transaksi pembatalan pesanan
      let cancelledOrderStock = 0;
      
      transactions.forEach((transaction: CoalInventoryTransaction) => {
        // Cek apakah ini adalah transaksi pengembalian dari order yang dibatalkan
        const isCancelledOrderReturn = 
          transaction.transaction_type === 'incoming' && 
          transaction.vehicle_info === 'cancelled_order_return';
        
        if (transaction.transaction_type === 'incoming') {
          // Hanya tambahkan ke total pemasukan jika bukan pengembalian order dibatalkan
          if (!isCancelledOrderReturn) {
            totalIncoming += transaction.quantity_kg;
          } else {
            // Jika ini pengembalian order dibatalkan, catat jumlahnya
            cancelledOrderStock += transaction.quantity_kg;
          }
          
          // Perbarui stok berdasarkan kualitas (semua transaksi incoming, termasuk cancelled order)
          if (transaction.quality_grade === 'premium') {
            totalPremium += transaction.quantity_kg;
          } else if (transaction.quality_grade === 'standard') {
            totalStandard += transaction.quantity_kg;
          } else if (transaction.quality_grade === 'economy') {
            totalEconomy += transaction.quantity_kg;
          }

          // Hitung nilai total untuk average price (hanya untuk transaksi normal)
          if (!isCancelledOrderReturn && transaction.price_per_kg && transaction.price_per_kg > 0) {
            totalValue += transaction.price_per_kg * transaction.quantity_kg;
            totalValueItems += transaction.quantity_kg;
          }
        } else if (transaction.transaction_type === 'outgoing') {
          totalOutgoing += transaction.quantity_kg;
          
          // Kurangi stok dari kualitas, dengan prioritas economy -> standard -> premium
          let remainingQuantity = transaction.quantity_kg;
          
          // Kurangi dari economy dulu
          if (totalEconomy > 0) {
            const economyReduction = Math.min(totalEconomy, remainingQuantity);
            totalEconomy -= economyReduction;
            remainingQuantity -= economyReduction;
          }
          
          // Jika masih ada sisa, kurangi dari standard
          if (remainingQuantity > 0 && totalStandard > 0) {
            const standardReduction = Math.min(totalStandard, remainingQuantity);
            totalStandard -= standardReduction;
            remainingQuantity -= standardReduction;
          }
          
          // Jika masih ada sisa, kurangi dari premium
          if (remainingQuantity > 0 && totalPremium > 0) {
            const premiumReduction = Math.min(totalPremium, remainingQuantity);
            totalPremium -= premiumReduction;
          }
        }

        // Perbarui tanggal transaksi terakhir
        if (!lastTransactionDate || new Date(transaction.transaction_date) > new Date(lastTransactionDate)) {
          lastTransactionDate = transaction.transaction_date;
        }
      });

      // Hitung current stock dan rata-rata harga
      // Current stock termasuk batubara dari pengembalian order yang dibatalkan
      const currentStock = totalIncoming - totalOutgoing + cancelledOrderStock;
      const averagePricePerKg = totalValueItems > 0 ? totalValue / totalValueItems : 0;
      const stockValue = currentStock * averagePricePerKg;
      
      console.log('Inventory Summary Calculation:', {
        totalIncoming,
        totalOutgoing,
        cancelledOrderStock,
        currentStock,
        totalPremium,
        totalStandard,
        totalEconomy
      });

      // Pastikan tidak ada nilai negatif
      const safeTotalPremium = Math.max(0, totalPremium);
      const safeTotalStandard = Math.max(0, totalStandard);
      const safeTotalEconomy = Math.max(0, totalEconomy);

      // Buat objek ringkasan stok
      const summary: CoalInventorySummary = {
        total_incoming_kg: totalIncoming,
        total_outgoing_kg: totalOutgoing,
        current_stock_kg: currentStock,
        average_price_per_kg: averagePricePerKg,
        last_transaction_date: lastTransactionDate,
        stock_value: stockValue,
        premium_stock_kg: safeTotalPremium,
        standard_stock_kg: safeTotalStandard,
        economy_stock_kg: safeTotalEconomy
      };

      // Perbarui atau buat baru ringkasan stok di database
      const { data: existingSummary } = await supabase
        .from('coal_inventory_summary')
        .select('id')
        .limit(1);

      if (existingSummary && existingSummary.length > 0) {
        // Update ringkasan yang ada
        await supabase
          .from('coal_inventory_summary')
          .update(summary)
          .eq('id', existingSummary[0].id);
      } else {
        // Buat ringkasan baru
        await supabase
          .from('coal_inventory_summary')
          .insert({ ...summary, id: uuidv4() });
      }
    } catch (error) {
      console.error('Error updating inventory summary:', error);
    }
  }
};
