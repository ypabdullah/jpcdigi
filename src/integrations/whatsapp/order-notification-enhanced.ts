/**
 * Enhanced WhatsApp order notification formatter
 * This file contains improved formatting for order notifications
 */

// Definisikan formatCurrency dan formatPaymentMethod di sini karena tidak diekspor dari api.ts
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPaymentMethod = (method: string): string => {
  if (method === 'bank-transfer') return 'Transfer Bank';
  if (method === 'cash-on-delivery') return 'Bayar di Tempat (COD)';
  if (method === 'e-wallet') return 'E-Wallet';
  if (method === 'qris') return 'QRIS';
  if (method === 'credit-card') return 'Kartu Kredit';
  return method;
};

/**
 * Format order items text with improved details
 */
export const formatOrderItemsText = (items: any[]) => {
  console.log('Memformat item pesanan dengan detail lengkap...');
  const safeItems = Array.isArray(items) ? items : [];
  console.log(`Total ${safeItems.length} item akan diformat`);
  
  if (safeItems.length === 0) {
    console.warn('Tidak ada item dalam pesanan!');  
    return {
      itemsText: 'Tidak ada item pesanan.',
      subtotal: 0
    };
  }
  
  // Log item untuk debugging
  safeItems.forEach((item, idx) => {
    console.log(`Item #${idx+1}:`, {
      name: item.product_name,
      price: item.price,
      qty: item.quantity,
      variant: item.variant || 'N/A'
    });
  });
  
  // Calculate subtotal
  const subtotal = safeItems.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.quantity || 0));
  }, 0);
  
  // Generate simplified items text to save space
  const itemsText = safeItems.map((item, index) => {
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    
    // Format ringkas untuk menghemat karakter
    return `${index+1}. ${item.product_name || 'Produk'} (${quantity}x) ${formatCurrency(price)}`;
  }).join('\n');
  
  console.log('Format item pesanan selesai, panjang teks:', itemsText.length);
  
  return {
    itemsText,
    subtotal
  };
};

/**
 * Format full customer order notification with enhanced details
 */
export const formatEnhancedOrderNotification = (
  order: any,
  customer: any,
  address: any,
  items: any[],
  shippingData?: any,
  paymentMethodData?: any
): string => {
  // Validate order data
  if (!order) {
    console.error('formatEnhancedOrderNotification: Order data is missing');
    order = { id: 'unknown', total: 0, status: 'pending' };
  }
  console.log('Memformat notifikasi order lengkap...');
  console.log('Data order:', { id: order.id, total: order.total, status: order.status });
  
  // Format date with more readable format
  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) + ' pukul ' + new Date(order.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) + ' pukul ' + new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
  
  // Format items with enhanced details
  console.log('Memformat detail item pesanan...');
  const { itemsText, subtotal } = formatOrderItemsText(items);
  console.log(`Hasil format items: ${itemsText.length} karakter, subtotal: ${subtotal}`);
  
  // Extract shipping data for display dan pastikan ongkos kirim muncul
  const shipping = shippingData || {
    provider: order.shipping_provider || 'JPC Delivery',
    service: order.shipping_service || 'Reguler',
    estimate: order.shipping_estimate || '1-3 Jam',
    cost: order.shipping_cost || 0
  };
  
  // Pastikan ongkos kirim ada dan muncul
  const shippingCost = order.shipping_cost || shipping.cost || 0;
  console.log('Customer notification - shipping cost:', shippingCost);
  
  // Extract discount data if available
  const discountData = order.discount_data || {};
  const hasDiscount = discountData && (discountData.value > 0 || discountData.code);
  
  // Format discount value if present
  const discountValue = hasDiscount ? (
    discountData.type === 'percentage' 
      ? `${discountData.value}%` 
      : formatCurrency(discountData.value || 0)
  ) : '0';
  
  // Format recipient details
  const recipientName = address?.recipient_name || customer?.name || 'N/A';
  const recipientPhone = address?.recipient_phone || customer?.phone || 'N/A';
  
  // Format alamat lengkap - pastikan semua data tampil
  const street = address?.street || 'N/A';
  const district = address?.district || '';
  const city = address?.city || 'N/A';
  const province = address?.province || 'N/A';
  const postalCode = address?.postal_code || '';
  const notes = address?.notes || '';
  
  // Format alamat untuk tampilan yang lebih jelas
  const formattedAddress = [
    street,
    district ? (district + (city ? `, ${city}` : '')) : city,
    `${province} ${postalCode}`.trim(),
    notes ? `Catatan: ${notes}` : ''
  ].filter(line => line && line.trim() !== '').join('\n');
  
  console.log('Alamat lengkap:', formattedAddress);
  
  // Generate structured message for the customer with simplified format (under 1000 characters)
  console.log('Menyusun pesan ringkas untuk memenuhi batas karakter WhatsApp...');
  const customerMessage = `🎉 *PESANAN BERHASIL DIBUAT* 🎉\n\n`+
    `Terima kasih ${customer?.name || 'Pelanggan'}!\n\n`+
    
    `*DETAIL PESANAN*\n`+
    `ID: #${order.id.substring(0, 8)}\n`+
    `Status: ${order.status === 'pending' ? 'Menunggu Pembayaran' : order.status || 'pending'}\n\n`+
    
    `*PENGIRIMAN*\n`+
    `Penerima: ${recipientName}\n`+
    `Alamat: ${address?.street || 'N/A'}\n`+
    `${district ? district + ', ' : ''}${city}\n`+
    `Kurir: ${shipping.provider || 'JPC Delivery'} (${shipping.service || 'Reguler'})\n`+
    `Ongkir: ${formatCurrency(shippingCost)}\n\n`+
    
    `*PRODUK*\n`+
    `${itemsText}\n\n`+
    
    `*PEMBAYARAN*\n`+
    `Subtotal: ${formatCurrency(subtotal)}\n`+
    `${hasDiscount ? `Diskon: -${discountValue}\n` : ''}`+
    `Ongkir: ${formatCurrency(shippingCost)}\n`+
    `Total: ${formatCurrency(order.total)}\n\n`+
    
    `*METODE BAYAR*: ${formatPaymentMethod(order.payment_method || 'N/A')}\n`+
    `${order.payment_method === 'bank-transfer' ? 
      `Bank: ${paymentMethodData?.bank_name || 'SeaBank'}\n`+
      `Rek: ${paymentMethodData?.account_number || '901958730549'} (${paymentMethodData?.account_name || 'JPC'})\n` : ''}\n`+
    
    `*INFO*: Hubungi 0813-9458-6882\n`+
    `*JAYA PERKASA CHARCOAL* 🙏`;
  
  // Cek panjang pesan dan potong jika masih terlalu panjang
  if (customerMessage.length > 995) {
    console.warn(`Pesan masih terlalu panjang: ${customerMessage.length} karakter, memotong...`);
    // Buat versi sangat ringkas jika masih terlalu panjang
    return `🎉 *PESANAN BERHASIL* 🎉\n\n`+
      `ID: #${order.id.substring(0, 8)}\n`+
      `Total: ${formatCurrency(order.total)}\n`+
      `Bayar: ${formatPaymentMethod(order.payment_method || 'N/A')}\n`+
      `${order.payment_method === 'bank-transfer' ? 
        `Bank: ${paymentMethodData?.bank_name || 'SeaBank'} / Rek: ${paymentMethodData?.account_number || '901958730549'}\n` : ''}\n`+
      `Hubungi 0813-9458-6882 untuk info lengkap\n`+
      `*JAYA PERKASA CHARCOAL* 🙏`;
  }
  
  console.log(`Pesan berhasil dibuat: ${customerMessage.length} karakter`);
  return customerMessage;
};

/**
 * Generate a simplified fallback message if the main one fails
 */
export const formatSimplifiedOrderNotification = (
  order: any,
  customer: any,
  paymentMethodData?: any,
  address?: any,
  items?: any[],
  shippingData?: any
) => {
  const shortOrderId = order.id.substring(0, 8);
  
  // Format tanggal
  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      
  // Format status pesanan
  const statusText = order.status === 'pending' ? 'Menunggu Pembayaran' : 
                     order.status === 'processing' ? 'Diproses' :
                     order.status === 'shipped' ? 'Dikirim' :
                     order.status === 'completed' ? 'Selesai' :
                     order.status || 'Menunggu';
  
  // Format ringkas untuk shipping
  const shipping = shippingData || {
    provider: order.shipping_provider || 'JPC Delivery',
    service: order.shipping_service || 'Reguler',
    cost: order.shipping_cost || 0,
    estimate: order.shipping_estimate || '1-3 Hari'
  };
  
  // Format item pesanan secara ringkas
  let itemsText = 'Produk tidak tersedia';
  if (Array.isArray(items) && items.length > 0) {
    // Batasi maksimal 3 item untuk menghemat karakter
    const maxItems = Math.min(items.length, 3);
    const itemsList = items.slice(0, maxItems).map((item, idx) => 
      `${idx+1}. ${item.product_name || 'Produk'} (${item.quantity || 1}x)`
    ).join('\n');
    
    // Tambahkan keterangan jika ada item yang tidak ditampilkan
    const remainingItems = items.length - maxItems;
    const remainingText = remainingItems > 0 ? `+${remainingItems} item lainnya` : '';
    
    itemsText = itemsList + (remainingText ? `\n${remainingText}` : '');
  }
  
  // Format alamat singkat
  const addressText = address ? 
    `${address.street ? address.street.substring(0, 25) + (address.street.length > 25 ? '...' : '') : 'N/A'}` +
    `${address.district ? ', ' + address.district : ''}` :
    'Alamat tidak tersedia';
  
  // Format item pesanan dengan lebih detail
  let detailedItemsText = 'Produk tidak tersedia';
  if (Array.isArray(items) && items.length > 0) {
    // Batasi maksimal 3 item untuk menghemat karakter
    const maxItems = Math.min(items.length, 3);
    const itemsList = items.slice(0, maxItems).map((item, idx) => 
      `${idx+1}. ${item.product_name || 'Produk'} (${item.quantity || 1}x) - ${formatCurrency(item.price || 0)}`
    ).join('\n');
    
    // Tambahkan keterangan jika ada item yang tidak ditampilkan
    const remainingItems = items.length - maxItems;
    const remainingText = remainingItems > 0 ? `+${remainingItems} item lainnya` : '';
    
    detailedItemsText = itemsList + (remainingText ? `\n${remainingText}` : '');
  }
  
  // Membuat pesan dengan informasi lengkap namun tetap ringkas
  return `🎉 *PESANAN BERHASIL DIBUAT* 🎉\n\n` +
    `Halo ${customer?.name || 'Pelanggan'}!\n\n` +
    
    `*DETAIL PESANAN*\n` +
    `ID: #${shortOrderId}\n` +
    `Tanggal: ${orderDate}\n` +
    `Status: ${statusText}\n\n` +
    
    `*PRODUK YANG DIPESAN*\n` +
    `${detailedItemsText}\n\n` +
    
    `*PENGIRIMAN*\n` +
    `Alamat: ${addressText}\n` +
    `Kurir: ${shipping.provider || 'JPC Delivery'}\n` +
    `Layanan: ${shipping.service || 'Reguler'}\n` +
    `Ongkir: ${formatCurrency(shipping.cost || 0)}\n` +
    `Estimasi: ${shipping.estimate || '1-3 Hari'}\n\n` +
    
    `*PEMBAYARAN*\n` +
    `Total: ${formatCurrency(order.total)}\n` +
    `Metode: ${formatPaymentMethod(order.payment_method || 'N/A')}\n` +
    `${order.payment_method === 'bank-transfer' ? 
      `Bank: ${paymentMethodData?.bank_name || 'SeaBank'}\n`+
      `Rek: ${paymentMethodData?.account_number || '901958730549'}\n` : ''}\n` +
    
    `*INFO*: Hubungi 0813-9458-6882\n` +
    `*JAYA PERKASA CHARCOAL* 🙏`;
};
