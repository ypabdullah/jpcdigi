import { sendWatsapIdMessage } from './api';
import { supabase } from '../supabase/client';

/**
 * Format status pesanan ke Bahasa Indonesia yang lebih mudah dipahami
 */
const formatStatusIndonesia = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Menunggu Pembayaran';
    case 'paid':
      return 'Pembayaran Diterima';
    case 'processing':
      return 'Sedang Diproses';
    case 'shipped':
      return 'Sedang Dikirim';
    case 'delivered':
      return 'Telah Diterima';
    case 'completed':
      return 'Selesai';
    case 'cancelled':
      return 'Dibatalkan';
    case 'refunded':
      return 'Dana Dikembalikan';
    default:
      return status;
  }
};

/**
 * Mendapatkan pesan notifikasi WhatsApp berdasarkan status pesanan
 */
const getStatusUpdateMessage = (orderId: string, status: string, orderDate?: string, customerName?: string): string => {
  // Format order ID
  const shortOrderId = orderId.substring(0, 8);
  const statusIndo = formatStatusIndonesia(status);
  
  // Basic message structure
  let message = `*UPDATE STATUS PESANAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `Halo${customerName ? ' ' + customerName : ''},\n\n`;
  message += `Pesanan #${shortOrderId} Anda ${orderDate ? `(${orderDate})` : ''} telah diperbarui.\n\n`;
  message += `*Status Saat Ini: ${statusIndo}*\n\n`;
  
  // Add more specific details based on status
  switch (status.toLowerCase()) {
    case 'pending':
      message += `Silakan segera lakukan pembayaran agar pesanan Anda dapat diproses.\n`;
      message += `Jika sudah melakukan pembayaran, mohon kirimkan bukti pembayaran kepada kami.\n`;
      break;
    
    case 'paid':
      message += `Terima kasih atas pembayaran Anda! Pesanan Anda akan segera kami proses.\n`;
      break;
      
    case 'processing':
      message += `Pesanan Anda sedang kami proses. Kami akan segera mempersiapkan pengiriman.\n`;
      break;
      
    case 'shipped':
      message += `Pesanan Anda telah dikirim! Anda akan menerima update pengiriman selanjutnya.\n`;
      message += `Mohon siapkan penerimaan barang di alamat pengiriman yang telah ditentukan.\n`;
      break;
      
    case 'delivered':
      message += `Pesanan Anda telah sampai di tujuan. Silakan konfirmasi penerimaan barang.\n`;
      message += `Jika ada pertanyaan atau masalah dengan pesanan, segera hubungi kami.\n`;
      break;
      
    case 'completed':
      message += `Terima kasih telah berbelanja di Jaya Perkasa Charcoal! Kami harap Anda puas dengan produk kami.\n`;
      message += `Silakan berikan ulasan untuk pesanan Anda melalui aplikasi kami.\n`;
      break;
      
    case 'cancelled':
      message += `Pesanan Anda telah dibatalkan. Jika Anda memiliki pertanyaan atau ingin membuat pesanan baru, silakan hubungi kami.\n`;
      break;
      
    case 'refunded':
      message += `Dana untuk pesanan Anda telah dikembalikan. Proses pengembalian dana membutuhkan waktu 1-3 hari kerja tergantung bank Anda.\n`;
      break;
  }
  
  message += `\nUntuk informasi lebih lanjut atau bantuan, silakan hubungi layanan pelanggan kami:\n`;
  message += `Telp/WA: 0813-9458-6882\n\n`;
  message += `Terima kasih telah berbelanja di\n*JAYA PERKASA CHARCOAL*`;
  
  return message;
};

/**
 * Mengirim notifikasi WhatsApp ke pelanggan saat status pesanan berubah
 */
export const sendOrderStatusUpdateToCustomer = async (
  orderId: string,
  newStatus: string
): Promise<boolean> => {
  try {
    // Get order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('user_id, created_at')
      .eq('id', orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error('Error fetching order data:', orderError);
      return false;
    }
    
    // Get customer data
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('name, phone, email')
      .eq('id', orderData.user_id)
      .single();
    
    if (customerError || !customerData || !customerData.phone) {
      console.error('Error fetching customer data or no phone number:', customerError);
      return false;
    }
    
    // Format date
    const orderDate = orderData.created_at 
      ? new Date(orderData.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined;
    
    // Generate message based on status
    const message = getStatusUpdateMessage(
      orderId,
      newStatus,
      orderDate,
      customerData.name
    );
    
    // Send WhatsApp message to customer
    console.log(`Sending order status update (${newStatus}) WhatsApp to customer:`, customerData.phone);
    return await sendWatsapIdMessage(customerData.phone, message);
    
  } catch (error) {
    console.error('Error sending status update via WhatsApp:', error);
    return false;
  }
};
