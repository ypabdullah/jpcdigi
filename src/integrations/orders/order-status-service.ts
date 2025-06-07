import { supabase } from '../supabase/client';
import { sendOrderStatusUpdateToCustomer } from '../whatsapp/order-status-notification';
import { toast } from '@/hooks/use-toast';

/**
 * Service untuk mengelola status pesanan dan mengirim notifikasi
 */
export class OrderStatusService {
  /**
   * Mengupdate status pesanan dan mengirim notifikasi WhatsApp ke pelanggan
   * @param orderId ID pesanan yang akan diupdate
   * @param newStatus Status baru pesanan
   * @param sendNotification Opsional, default true - apakah akan mengirim notifikasi WhatsApp
   * @returns Promise dengan hasil update
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    sendNotification: boolean = true
  ): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      // 1. Update status pesanan di database
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        return {
          success: false,
          message: 'Gagal mengupdate status pesanan',
          error
        };
      }

      console.log(`Order ${orderId} status updated to ${newStatus}`);

      // 2. Kirim notifikasi WhatsApp ke pelanggan jika opsi diaktifkan
      if (sendNotification) {
        try {
          const whatsappSent = await sendOrderStatusUpdateToCustomer(orderId, newStatus);
          console.log(`WhatsApp notification for order ${orderId} status update: ${whatsappSent ? 'sent' : 'failed'}`);
        } catch (whatsappError) {
          console.error('Error sending WhatsApp notification:', whatsappError);
          // Tidak mengembalikan error karena update status tetap berhasil
        }
      }

      return {
        success: true,
        message: `Status pesanan berhasil diupdate menjadi ${newStatus}`
      };
    } catch (error) {
      console.error('Unexpected error updating order status:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat mengupdate status pesanan',
        error
      };
    }
  }

  /**
   * Mengambil histori perubahan status pesanan
   * @param orderId ID pesanan
   * @returns Promise dengan data histori status
   */
  static async getOrderStatusHistory(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order status history:', error);
        return { success: false, data: null, error };
      }

      return { success: true, data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching status history:', error);
      return { success: false, data: null, error };
    }
  }

  /**
   * Menyimpan perubahan status ke histori
   * @param orderId ID pesanan
   * @param oldStatus Status lama
   * @param newStatus Status baru
   * @param adminId ID admin yang melakukan perubahan
   * @param notes Catatan opsional tentang perubahan
   */
  static async recordStatusChange(
    orderId: string,
    oldStatus: string,
    newStatus: string,
    adminId: string,
    notes?: string
  ) {
    try {
      const { error } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          old_status: oldStatus,
          new_status: newStatus,
          admin_id: adminId,
          notes: notes || null,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording status change history:', error);
      }
    } catch (error) {
      console.error('Unexpected error recording status change:', error);
    }
  }
}

/**
 * Hook untuk component React untuk memudahkan penggunaan service
 * @param showToast Apakah akan menampilkan toast notification di UI
 * @returns Object dengan fungsi updateStatus
 */
export const useOrderStatusUpdater = (showToast = true) => {
  const updateStatus = async (
    orderId: string,
    currentStatus: string,
    newStatus: string,
    adminId: string,
    options?: {
      notes?: string;
      sendWhatsApp?: boolean;
    }
  ) => {
    const { sendWhatsApp = true, notes } = options || {};
    
    try {
      // Update status pesanan dan kirim notifikasi WhatsApp
      const result = await OrderStatusService.updateOrderStatus(
        orderId,
        newStatus,
        sendWhatsApp
      );
      
      if (result.success) {
        // Rekam perubahan status untuk histori
        await OrderStatusService.recordStatusChange(
          orderId,
          currentStatus,
          newStatus,
          adminId,
          notes
        );
        
        if (showToast) {
          toast({
            title: 'Status Pesanan Diperbarui',
            description: `Pesanan #${orderId.substring(0, 8)} telah diubah menjadi ${newStatus}`,
          });
        }
        
        return { success: true, data: result };
      } else {
        if (showToast) {
          toast({
            title: 'Gagal Memperbarui Status',
            description: result.message,
            variant: 'destructive'
          });
        }
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in updateStatus hook:', error);
      
      if (showToast) {
        toast({
          title: 'Terjadi Kesalahan',
          description: 'Gagal memperbarui status pesanan',
          variant: 'destructive'
        });
      }
      
      return { success: false, error };
    }
  };
  
  return { updateStatus };
};
