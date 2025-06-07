# Sistem Voucher JPC Apps

## Pengenalan
Dokumen ini berisi informasi tentang sistem voucher JPC Apps, yang memungkinkan admin untuk membuat dan mengelola voucher diskon, serta pelanggan untuk menggunakan voucher tersebut saat checkout.

## Fitur
- **Manajemen Voucher (Admin)**
  - Membuat voucher baru dengan kode unik
  - Menetapkan jenis diskon (persentase atau nilai tetap)
  - Mengatur nilai diskon
  - Menetapkan batas minimum pembelian
  - Mengatur batas maksimum diskon (untuk diskon persentase)
  - Mengatur tanggal mulai dan berakhir voucher
  - Menetapkan batas penggunaan voucher
  - Mengaktifkan/menonaktifkan voucher
  - Menambahkan deskripsi voucher

- **Penggunaan Voucher (Pelanggan)**
  - Memasukkan kode voucher saat checkout
  - Melihat nilai diskon yang diterapkan
  - Melihat total setelah diskon
  - Membatalkan penggunaan voucher

## Skema Database
Sistem voucher menggunakan tabel `vouchers` di Supabase dengan struktur berikut:

```sql
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  description TEXT
);
```

Tabel orders juga diperbarui dengan kolom berikut:
```sql
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES public.vouchers(id);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
```

## Kebijakan Keamanan (RLS)
Kebijakan Row Level Security diterapkan sebagai berikut:
- Pelanggan hanya dapat melihat voucher aktif dan masih berlaku
- Admin dapat mengelola (membuat, melihat, mengubah, menghapus) semua voucher

## Halaman Admin
Halaman admin untuk voucher dapat diakses di `/admin/vouchers` dan menyediakan antarmuka CRUD lengkap untuk mengelola voucher:
- Daftar voucher dengan informasi lengkap
- Form untuk menambah/mengedit voucher
- Opsi untuk mengaktifkan/menonaktifkan voucher
- Opsi untuk menghapus voucher

## Proses Checkout
Selama proses checkout, pelanggan dapat:
1. Memasukkan kode voucher di form yang disediakan
2. Mengklik tombol "Terapkan" untuk memvalidasi dan menerapkan voucher
3. Melihat nilai diskon yang diterapkan
4. Melihat total setelah diskon
5. Mengklik tombol "Hapus" untuk membatalkan penerapan voucher

## Batasan Teknis
- Kode voucher bersifat case-sensitive
- Voucher hanya dapat digunakan jika:
  - Voucher masih aktif
  - Tanggal saat ini berada dalam rentang tanggal mulai dan berakhir voucher
  - Voucher belum mencapai batas penggunaan (jika ditentukan)
  - Total pembelian memenuhi minimum pembelian (jika ditentukan)

## Struktur Kode
- **Model**: `src/data/models.ts` - Mendefinisikan interface Voucher
- **Service**: `src/integrations/voucher/service.ts` - Menyediakan fungsi CRUD untuk voucher
- **Admin Page**: `src/pages/admin/VoucherPage.tsx` - Halaman admin untuk manajemen voucher
- **Checkout**: `src/pages/CheckoutPage.tsx` - Terintegrasi dengan fungsi validasi dan penerapan voucher

## Contoh Penggunaan
1. **Membuat Voucher (Admin)**:
   - Buka halaman Admin > Voucher
   - Isi form dengan informasi voucher (kode, jenis diskon, nilai, dll.)
   - Klik "Simpan" untuk membuat voucher baru

2. **Menggunakan Voucher (Pelanggan)**:
   - Tambahkan produk ke keranjang
   - Buka halaman Checkout
   - Masukkan kode voucher di kolom yang tersedia
   - Klik "Terapkan" untuk menerapkan diskon

## Pengelolaan Error
Sistem voucher dirancang untuk menangani berbagai error dengan pesan yang informatif:
- Voucher tidak ditemukan
- Voucher sudah tidak aktif
- Voucher sudah kadaluarsa
- Voucher sudah mencapai batas penggunaan
- Total pembelian kurang dari minimum yang diperlukan
