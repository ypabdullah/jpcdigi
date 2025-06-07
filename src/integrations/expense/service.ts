import { supabase } from '../supabase/client';
import { CompanyExpense, ExpenseCategory } from '@/data/models';
import { v4 as uuidv4 } from 'uuid';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Service untuk mengelola pengeluaran perusahaan
 */
// Interface untuk hasil operasi CRUD
interface CrudResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export const CompanyExpenseService = {
  /**
   * Mengambil daftar kategori pengeluaran
   */
  async getCategories(): Promise<CrudResult<ExpenseCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
        
      return { data: data as ExpenseCategory[], error };
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Menambahkan kategori pengeluaran baru
   * @param category Kategori pengeluaran baru
   */
  async addCategory(category: Partial<ExpenseCategory>): Promise<CrudResult<ExpenseCategory>> {
    try {
      if (!category.id) {
        category.id = uuidv4();
      }
      
      if (!category.created_at) {
        category.created_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('expense_categories')
        .insert(category)
        .select()
        .single();
        
      return { data: data as ExpenseCategory, error };
    } catch (error) {
      console.error('Error adding expense category:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mengambil daftar pengeluaran
   * @param limit Jumlah maksimal data yang diambil
   * @param offset Offset untuk pagination
   * @param filters Filter tambahan (opsional)
   */
  async getExpenses(
    limit: number = 100, 
    offset: number = 0,
    filters?: {
      category_id?: string;
      from_date?: string;
      to_date?: string;
      search?: string;
      status?: 'pending' | 'approved' | 'rejected';
    }
  ): Promise<CrudResult<CompanyExpense[]>> {
    try {
      let query = supabase
        .from('company_expenses')
        .select(`
          *,
          expense_categories!inner (
            name
          )
        `)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Tambahkan filter jika ada
      if (filters) {
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id);
        }
        
        if (filters.from_date) {
          query = query.gte('date', filters.from_date);
        }
        
        if (filters.to_date) {
          query = query.lte('date', filters.to_date);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.search) {
          query = query.or(`description.ilike.%${filters.search}%,paid_by.ilike.%${filters.search}%`);
        }
      }
      
      const { data, error } = await query;
      
      // Format the data to include category_name
      const formattedData = data?.map(expense => ({
        ...expense,
        category_name: expense.expense_categories?.name
      }));
      
      return { data: formattedData as CompanyExpense[], error };
    } catch (error) {
      console.error('Error fetching company expenses:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Menambahkan pengeluaran baru
   * @param expense Data pengeluaran baru
   */
  async addExpense(expense: Partial<CompanyExpense>): Promise<CrudResult<CompanyExpense>> {
    try {
      // Validasi field yang diperlukan
      const requiredFields = ['date', 'amount', 'description', 'category_id', 'created_by'];
      for (const field of requiredFields) {
        if (!expense[field as keyof Partial<CompanyExpense>]) {
          throw new Error(`Field ${field} wajib diisi`);
        }
      }
      
      // Pastikan ID dibuat
      if (!expense.id) {
        expense.id = uuidv4();
      }
      
      // Pastikan created_at ada
      if (!expense.created_at) {
        expense.created_at = new Date().toISOString();
      }
      
      // Set default status jika tidak disediakan
      if (!expense.status) {
        expense.status = 'pending';
      }
      
      // Simpan ke database
      const { data, error } = await supabase
        .from('company_expenses')
        .insert(expense)
        .select(`
          *,
          expense_categories!inner (
            name
          )
        `)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format data untuk direturn
      const formattedExpense = {
        ...data,
        category_name: data.expense_categories?.name
      };
      
      return { data: formattedExpense as CompanyExpense, error: null };
    } catch (error) {
      console.error('Error adding company expense:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Memperbarui pengeluaran
   * @param id ID pengeluaran yang akan diperbarui
   * @param expense Data pengeluaran yang diperbarui
   */
  async updateExpense(id: string, expense: Partial<CompanyExpense>): Promise<CrudResult<CompanyExpense>> {
    try {
      // Update updated_at
      expense.updated_at = new Date().toISOString();
      
      // Update di database
      const { data, error } = await supabase
        .from('company_expenses')
        .update(expense)
        .eq('id', id)
        .select(`
          *,
          expense_categories!inner (
            name
          )
        `)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Format data untuk direturn
      const formattedExpense = {
        ...data,
        category_name: data.expense_categories?.name
      };
      
      return { data: formattedExpense as CompanyExpense, error: null };
    } catch (error) {
      console.error('Error updating company expense:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Menghapus pengeluaran
   * @param id ID pengeluaran yang akan dihapus
   */
  async deleteExpense(id: string): Promise<CrudResult<null>> {
    try {
      const { error } = await supabase
        .from('company_expenses')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting company expense:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mendapatkan total pengeluaran per bulan dalam setahun terakhir
   */
  async getMonthlyExpenses(): Promise<CrudResult<{ month: string; total: number }[]>> {
    try {
      // Ambil tanggal satu tahun yang lalu
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { data, error } = await supabase
        .from('company_expenses')
        .select('date, amount')
        .gte('date', oneYearAgo.toISOString().split('T')[0])
        .order('date');
      
      if (error) {
        throw error;
      }
      
      // Group by month
      const monthlyData: Record<string, number> = {};
      
      data?.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        
        monthlyData[monthKey] += expense.amount;
      });
      
      // Convert to array format
      const monthlyExpenses = Object.entries(monthlyData).map(([month, total]) => ({
        month,
        total
      }));
      
      return { data: monthlyExpenses, error: null };
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mendapatkan total pengeluaran berdasarkan kategori dalam periode tertentu
   * @param fromDate Tanggal awal (format: YYYY-MM-DD)
   * @param toDate Tanggal akhir (format: YYYY-MM-DD)
   */
  async getExpensesByCategory(fromDate?: string, toDate?: string): Promise<CrudResult<{ category: string; total: number }[]>> {
    try {
      let query = supabase
        .from('company_expenses')
        .select(`
          amount,
          expense_categories!inner (
            id,
            name
          )
        `);
      
      if (fromDate) {
        query = query.gte('date', fromDate);
      }
      
      if (toDate) {
        query = query.lte('date', toDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Group by category
      const categoryData: Record<string, { id: string; name: string; total: number }> = {};
      
      data?.forEach(expense => {
        // expense_categories merupakan hasil join yang mungkin berupa array atau object
        const categoryId = typeof expense.expense_categories === 'object' && !Array.isArray(expense.expense_categories)
          ? expense.expense_categories.id
          : expense.category_id;
        const categoryName = typeof expense.expense_categories === 'object' && !Array.isArray(expense.expense_categories)
          ? expense.expense_categories.name
          : 'Uncategorized';
        
        if (!categoryData[categoryId]) {
          categoryData[categoryId] = {
            id: categoryId,
            name: categoryName,
            total: 0
          };
        }
        
        categoryData[categoryId].total += expense.amount;
      });
      
      // Convert to array format
      const categoryExpenses = Object.values(categoryData).map(category => ({
        category: category.name,
        total: category.total
      }));
      
      return { data: categoryExpenses, error: null };
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mendapatkan total pengeluaran dalam periode tertentu
   * @param fromDate Tanggal awal (format: YYYY-MM-DD)
   * @param toDate Tanggal akhir (format: YYYY-MM-DD)
   */
  async getTotalExpenses(fromDate?: string, toDate?: string): Promise<CrudResult<number>> {
    try {
      let query = supabase
        .from('company_expenses')
        .select('amount');
      
      if (fromDate) {
        query = query.gte('date', fromDate);
      }
      
      if (toDate) {
        query = query.lte('date', toDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Sum all expenses
      const total = data?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      
      return { data: total, error: null };
    } catch (error) {
      console.error('Error fetching total expenses:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mengurangi pengeluaran ketika pesanan dibatalkan
   * @param orderId ID pesanan yang dibatalkan
   * @param userId ID pengguna admin yang melakukan tindakan
   * @param orderTotal Total nilai pesanan yang dibatalkan
   */
  async reduceCostFromCancelledOrder(orderId: string, userId: string, orderTotal: number): Promise<boolean> {
    try {
      // Periksa apakah sudah ada pengeluaran yang terkait dengan pesanan ini
      const { data: existingExpenses } = await supabase
        .from('company_expenses')
        .select('*')
        .eq('description', `Order #${orderId.substring(0, 8)}`)
        .single();

      // Jika tidak ada pengeluaran terkait, tidak perlu melakukan apa-apa
      if (!existingExpenses) {
        console.log(`No expenses found for order ${orderId}`);
        return true;
      }

      // Buat catatan pengeluaran baru dengan jumlah negatif untuk mengkompensasi pengeluaran sebelumnya
      const cancelExpense: Partial<CompanyExpense> = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        amount: -Math.abs(orderTotal), // Nilai negatif untuk mengurangi total pengeluaran
        description: `Pembatalan Order #${orderId.substring(0, 8)}`,
        category_id: existingExpenses.category_id,
        paid_by: 'System', 
        payment_method: 'Adjustment',
        status: 'approved', // Langsung disetujui karena ini adalah penyesuaian sistem
        created_by: userId,
        created_at: new Date().toISOString(),
        document_reference: orderId,
        notes: `Pengurangan biaya otomatis untuk pesanan #${orderId.substring(0, 8)} yang dibatalkan`
      };

      // Simpan ke database
      const { error } = await supabase
        .from('company_expenses')
        .insert(cancelExpense);

      if (error) {
        console.error('Error reducing expense for cancelled order:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in reduceCostFromCancelledOrder:', error);
      return false;
    }
  }
};
