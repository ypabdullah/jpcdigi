import { supabase } from '../supabase/client';
import { Voucher } from '@/data/models';
import { v4 as uuidv4 } from 'uuid';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Service untuk mengelola voucher
 */
// Interface untuk hasil operasi CRUD
interface CrudResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export const VoucherService = {
  /**
   * Mengambil daftar voucher
   * @param limit Jumlah maksimal data yang diambil
   * @param offset Offset untuk pagination
   * @param filters Filter tambahan (opsional)
   */
  async getVouchers(
    limit: number = 100, 
    offset: number = 0,
    filters?: {
      is_active?: boolean;
      search?: string;
    }
  ): Promise<CrudResult<Voucher[]>> {
    try {
      console.log('Fetching vouchers with params:', { limit, offset, filters });

      // Cek dahulu apakah tabel ada
      const { error: tableCheckError } = await supabase
        .from('vouchers')
        .select('count', { count: 'exact', head: true });

      if (tableCheckError) {
        console.error('Error checking vouchers table:', tableCheckError);
        
        // Jika error berkaitan dengan tabel tidak ada, kembalikan error yang jelas
        if (tableCheckError.code === 'PGRST116' || 
            (tableCheckError.message && tableCheckError.message.includes('does not exist'))) {
          return { 
            data: [], 
            error: new Error('Tabel vouchers belum dibuat. Klik tombol Inisialisasi Data untuk membuat tabel.') 
          };
        }
        
        return { data: [], error: tableCheckError };
      }
      
      // Lanjutkan dengan query jika tabel ada
      let query = supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Tambahkan filter jika ada
      if (filters) {
        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }
        
        if (filters.search) {
          query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
      }
      
      // Tambahkan pagination
      query = query.range(offset, offset + limit - 1);
      
      // Eksekusi query
      console.log('Executing query for vouchers...');
      const { data, error } = await query;
      
      if (error) {
        console.error('Error in vouchers query:', error);
        return { data: [], error };
      }
      
      console.log('Successfully fetched vouchers:', data?.length || 0, 'results');
      return { data: data as Voucher[], error: null };
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return { data: [], error: error as Error };
    }
  },

  /**
   * Menambahkan voucher baru
   * @param voucher Data voucher baru
   */
  async addVoucher(voucher: Partial<Voucher>): Promise<CrudResult<Voucher>> {
    try {
      // Validasi field yang diperlukan
      const requiredFields = ['code', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'];
      for (const field of requiredFields) {
        if (!voucher[field as keyof Partial<Voucher>]) {
          throw new Error(`Field ${field} wajib diisi`);
        }
      }
      
      // Pastikan kode voucher unik
      const { data: existingVoucher, error: uniqueCheckError } = await supabase
        .from('vouchers')
        .select('code')
        .eq('code', voucher.code)
        .maybeSingle();
      
      if (uniqueCheckError) {
        console.error('Error checking unique voucher:', uniqueCheckError);
        throw new Error(`Gagal memeriksa kode voucher: ${uniqueCheckError.message || 'Unknown error'}`);
      }
      
      if (existingVoucher) {
        throw new Error(`Kode voucher '${voucher.code}' sudah digunakan`);
      }
      
      // Pastikan ID dibuat
      if (!voucher.id) {
        voucher.id = uuidv4();
      }
      
      // Set default values
      if (voucher.usage_count === undefined) {
        voucher.usage_count = 0;
      }
      
      // Pastikan created_at ada
      if (!voucher.created_at) {
        voucher.created_at = new Date().toISOString();
      }
      
      // Pastikan format tanggal benar
      if (typeof voucher.start_date === 'string' && !voucher.start_date.includes('T')) {
        try {
          // Konversi dari YYYY-MM-DD ke format ISO
          voucher.start_date = new Date(`${voucher.start_date}T00:00:00`).toISOString();
        } catch (e) {
          throw new Error(`Format tanggal mulai tidak valid: ${voucher.start_date}`);
        }
      }
      
      if (typeof voucher.end_date === 'string' && !voucher.end_date.includes('T')) {
        try {
          // Konversi dari YYYY-MM-DD ke format ISO dengan waktu akhir hari
          voucher.end_date = new Date(`${voucher.end_date}T23:59:59`).toISOString();
        } catch (e) {
          throw new Error(`Format tanggal berakhir tidak valid: ${voucher.end_date}`);
        }
      }
      
      // Log data yang akan disimpan
      console.log('Saving voucher data:', JSON.stringify(voucher, null, 2));
      
      // Simpan ke database
      const { data, error } = await supabase
        .from('vouchers')
        .insert(voucher)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(`Gagal menyimpan voucher: ${error.message || 'Unknown database error'}`);
      }
      
      return { data: data as Voucher, error: null };
    } catch (error: any) {
      // Pastikan error selalu memiliki pesan yang jelas
      const errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
      console.error('Error adding voucher:', errorMessage);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  /**
   * Memperbarui voucher
   * @param id ID voucher yang akan diperbarui
   * @param voucher Data voucher yang diperbarui
   */
  async updateVoucher(id: string, voucher: Partial<Voucher>): Promise<CrudResult<Voucher>> {
    try {
      if (!id) {
        throw new Error('ID voucher tidak boleh kosong');
      }
      
      // Jika kode berubah, pastikan kode baru unik
      if (voucher.code) {
        const { data: existingVoucher, error: uniqueCheckError } = await supabase
          .from('vouchers')
          .select('code')
          .eq('code', voucher.code)
          .neq('id', id)
          .maybeSingle();
        
        if (uniqueCheckError) {
          console.error('Error checking unique voucher:', uniqueCheckError);
          throw new Error(`Gagal memeriksa kode voucher: ${uniqueCheckError.message || 'Unknown error'}`);
        }
        
        if (existingVoucher) {
          throw new Error(`Kode voucher '${voucher.code}' sudah digunakan`);
        }
      }
      
      // Pastikan format tanggal benar
      if (voucher.start_date && typeof voucher.start_date === 'string' && !voucher.start_date.includes('T')) {
        try {
          // Konversi dari YYYY-MM-DD ke format ISO
          voucher.start_date = new Date(`${voucher.start_date}T00:00:00`).toISOString();
        } catch (e) {
          throw new Error(`Format tanggal mulai tidak valid: ${voucher.start_date}`);
        }
      }
      
      if (voucher.end_date && typeof voucher.end_date === 'string' && !voucher.end_date.includes('T')) {
        try {
          // Konversi dari YYYY-MM-DD ke format ISO dengan waktu akhir hari
          voucher.end_date = new Date(`${voucher.end_date}T23:59:59`).toISOString();
        } catch (e) {
          throw new Error(`Format tanggal berakhir tidak valid: ${voucher.end_date}`);
        }
      }
      
      // Update updated_at
      voucher.updated_at = new Date().toISOString();
      
      // Log data yang akan diupdate
      console.log('Updating voucher data:', JSON.stringify({ id, voucher }, null, 2));
      
      // Update di database
      const { data, error } = await supabase
        .from('vouchers')
        .update(voucher)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(`Gagal memperbarui voucher: ${error.message || 'Unknown database error'}`);
      }
      
      return { data: data as Voucher, error: null };
    } catch (error: any) {
      // Pastikan error selalu memiliki pesan yang jelas
      const errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
      console.error('Error updating voucher:', errorMessage);
      return { data: null, error: new Error(errorMessage) };
    }
  },

  /**
   * Menghapus voucher
   * @param id ID voucher yang akan dihapus
   */
  async deleteVoucher(id: string): Promise<CrudResult<null>> {
    try {
      const { error } = await supabase
        .from('vouchers')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting voucher:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mengaktifkan atau menonaktifkan voucher
   * @param id ID voucher
   * @param isActive Status aktif baru
   */
  async toggleVoucherStatus(id: string, isActive: boolean): Promise<CrudResult<Voucher>> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data: data as Voucher, error: null };
    } catch (error) {
      console.error('Error toggling voucher status:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mengambil voucher berdasarkan kode
   * @param code Kode voucher
   */
  async getVoucherByCode(code: string): Promise<CrudResult<Voucher>> {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Kode error untuk "No rows returned"
          return { data: null, error: new Error('Kode voucher tidak valid atau sudah tidak aktif') };
        }
        throw error;
      }
      
      // Cek apakah voucher masih berlaku
      const now = new Date();
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (now < startDate) {
        return { data: null, error: new Error('Voucher belum berlaku') };
      }
      
      if (now > endDate) {
        return { data: null, error: new Error('Voucher sudah berakhir') };
      }
      
      // Cek batas penggunaan
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        return { data: null, error: new Error('Voucher sudah mencapai batas penggunaan') };
      }
      
      return { data: data as Voucher, error: null };
    } catch (error) {
      console.error('Error getting voucher by code:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Menghitung diskon yang didapatkan dari voucher
   * @param voucher Voucher yang digunakan
   * @param subtotal Total belanja sebelum diskon
   */
  calculateDiscount(voucher: Voucher, subtotal: number): number {
    // Cek minimum pembelian
    if (voucher.min_purchase && subtotal < voucher.min_purchase) {
      return 0;
    }
    
    let discount = 0;
    
    if (voucher.discount_type === 'percentage') {
      // Diskon persentase
      discount = subtotal * (voucher.discount_value / 100);
      
      // Batasi dengan max_discount jika ada
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    } else {
      // Diskon nominal tetap
      discount = voucher.discount_value;
      
      // Pastikan diskon tidak melebihi subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    }
    
    return discount;
  },

  /**
   * Mencatat penggunaan voucher
   * @param voucherId ID voucher yang digunakan
   */
  async incrementUsageCount(voucherId: string): Promise<CrudResult<Voucher>> {
    try {
      // Dapatkan voucher saat ini
      const { data: currentVoucher, error: fetchError } = await supabase
        .from('vouchers')
        .select('usage_count')
        .eq('id', voucherId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Increment usage_count
      const newCount = (currentVoucher.usage_count || 0) + 1;
      
      // Update database
      const { data, error } = await supabase
        .from('vouchers')
        .update({ 
          usage_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', voucherId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return { data: data as Voucher, error: null };
    } catch (error) {
      console.error('Error incrementing voucher usage count:', error);
      return { data: null, error: error as Error };
    }
  }
};
