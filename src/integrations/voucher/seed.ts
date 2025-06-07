import { supabase } from '../supabase/client';
import { Voucher } from '@/data/models';
import { v4 as uuidv4 } from 'uuid';

// Fungsi untuk menambahkan voucher awal ke database
export const seedVouchers = async (): Promise<void> => {
  try {
    console.log('Mulai menambahkan voucher awal...');
    
    // Periksa apakah tabel vouchers sudah ada
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('vouchers')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      // Tabel belum ada, coba buat tabel terlebih dahulu
      await createVouchersTable();
    }
    
    // Daftar voucher contoh untuk ditambahkan
    const exampleVouchers: Partial<Voucher>[] = [
      {
        code: 'WELCOME10',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase: 100000,
        max_discount: 50000,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        usage_limit: 100,
        usage_count: 0,
        is_active: true,
        description: 'Diskon 10% untuk pelanggan baru dengan minimum pembelian Rp 100.000'
      },
      {
        code: 'LIBURAN25',
        discount_type: 'percentage',
        discount_value: 25,
        min_purchase: 200000,
        max_discount: 100000,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        usage_limit: 50,
        usage_count: 0,
        is_active: true,
        description: 'Diskon liburan 25% dengan minimum pembelian Rp 200.000'
      },
      {
        code: 'HEMAT50K',
        discount_type: 'fixed',
        discount_value: 50000,
        min_purchase: 250000,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
        usage_limit: 30,
        usage_count: 0,
        is_active: true,
        description: 'Potongan langsung Rp 50.000 dengan minimum pembelian Rp 250.000'
      }
    ];
    
    // Tambahkan setiap voucher ke database jika belum ada
    for (const voucher of exampleVouchers) {
      // Cek apakah voucher dengan kode tersebut sudah ada
      const { data: existingVoucher } = await supabase
        .from('vouchers')
        .select('id')
        .eq('code', voucher.code)
        .maybeSingle();
      
      if (!existingVoucher) {
        // Tambahkan voucher baru
        const { data, error } = await supabase
          .from('vouchers')
          .insert([voucher]);
        
        if (error) {
          console.error(`Gagal menambahkan voucher ${voucher.code}:`, error);
        } else {
          console.log(`Berhasil menambahkan voucher ${voucher.code}`);
        }
      } else {
        console.log(`Voucher ${voucher.code} sudah ada, melewati...`);
      }
    }
    
    console.log('Selesai menambahkan voucher awal');
  } catch (error) {
    console.error('Gagal menambahkan voucher awal:', error);
  }
};

// Fungsi untuk membuat tabel vouchers jika belum ada
const createVouchersTable = async (): Promise<void> => {
  try {
    console.log('Membuat tabel vouchers dengan metode sederhana...');
    
    // Pendekatan sederhana: coba buat dengan insert langsung tanpa RPC
    const { error: insertError } = await supabase.from('vouchers').insert({
      id: uuidv4(),
      code: 'WELCOME10',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 100000,
      max_discount: 50000,
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
      usage_limit: 100,
      usage_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      description: 'Diskon 10% untuk pelanggan baru dengan minimum pembelian Rp 100.000'
    });
    
    if (insertError) {
      console.error('Gagal membuat tabel dengan insert langsung:', insertError);
      
      // Jika gagal, berarti tabel tidak ada, coba dengan SQL langsung melalui REST API
      console.log('Mencoba membuat tabel dengan metode REST API...');
      
      // Buat tabel vouchers melalui REST API langsung
      const migrationUrl = `https://vpztrjwitxvldrdhndlr.supabase.co/rest/v1/rpc/create_vouchers_table`;
      const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwenRyandpdHh2bGRyZGhuZGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTE3NzIsImV4cCI6MjA2MzM4Nzc3Mn0._NFTwCpQGgMThUeh1sew8y5ulRXSGmwHLmXRQx544PM";
      const response = await fetch(migrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        console.error('REST API call failed:', await response.text());
        console.log('Metode REST API gagal, mencoba metode terakhir - disable RLS dan insert');
        
        // Metode terakhir: Coba direktori disable RLS terlebih dahulu
        await disableRLSAndCreateVouchers();
      } else {
        console.log('Tabel berhasil dibuat dengan metode REST API');
      }
    } else {
      console.log('Berhasil menambahkan voucher pertama, tabel telah dibuat atau sudah ada');
    }
    
    // Cek ulang jika tabel sudah ada
    const { data, error: checkError } = await supabase
      .from('vouchers')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Tabel masih belum dapat diakses:', checkError);
    } else {
      console.log('Tabel vouchers berhasil dibuat dan dapat diakses', data);
    }
  } catch (error) {
    console.error('Gagal membuat tabel vouchers:', error);
  }
};

// Fungsi untuk disable RLS dan membuat tabel vouchers - metode terakhir
const disableRLSAndCreateVouchers = async (): Promise<void> => {
  try {
    console.log('Mencoba membuat voucher dengan login admin...');
    
    // Coba tambahkan voucher sederhana sebagai admin
    const { error } = await supabase.from('vouchers').insert({
      id: uuidv4(), // Menggunakan uuid yang sudah diimpor
      code: 'SIMPLETEST',
      discount_type: 'fixed',
      discount_value: 20000,
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      description: 'Voucher test sistem'
    });
    
    if (error) {
      console.error('Gagal dengan semua metode:', error);
      // Tampilkan pesan untuk kontak admin database
      console.log('Solusi: Hubungi admin database untuk membuat tabel vouchers secara manual');
    } else {
      console.log('Berhasil membuat voucher dengan metode terakhir');
    }
  } catch (error) {
    console.error('Error pada metode terakhir:', error);
  }
};

// Fungsi untuk mengecek tabel vouchers di database
export const checkVouchersTable = async (): Promise<boolean> => {
  try {
    console.log('Mengecek keberadaan tabel vouchers...');
    
    // Mencoba mengecek keberadaan tabel dengan select count
    const { data, error } = await supabase
      .from('vouchers')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      // Jika error dengan kode 'PGRST116' atau error message menunjukkan tabel tidak ada
      if (error.code === 'PGRST116' || 
          (error.message && error.message.includes('relation') && error.message.includes('does not exist'))) {
        console.log('Tabel vouchers belum ada, mencoba membuat tabel...');
        
        // Mencoba membuat tabel vouchers
        await createVouchersTable();
        
        // Cek lagi apakah tabel berhasil dibuat
        const checkResult = await supabase.from('vouchers').select('count(*)', { count: 'exact', head: true });
        if (!checkResult.error) {
          console.log('Tabel vouchers berhasil dibuat!');
          return true;
        } else {
          console.error('Gagal membuat tabel vouchers:', checkResult.error);
          return false;
        }
      }
      
      console.error('Error saat mengecek tabel vouchers:', error);
      return false;
    }
    
    // Jika tidak ada error, maka tabel ada
    console.log('Tabel vouchers ditemukan');
    return true;
  } catch (error) {
    console.error('Gagal mengecek tabel vouchers:', error);
    return false;
  }
};
