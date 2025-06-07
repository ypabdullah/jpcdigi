import { supabase } from '../supabase/client';
import { sendWatsapIdMessage } from './api';

/**
 * Interface untuk opsi broadcast
 */
export interface BroadcastOptions {
  recipientType: 'all' | 'selected' | 'filtered';
  selectedIds?: string[]; // ID pelanggan yang dipilih, digunakan jika recipientType adalah 'selected'
  filterOptions?: {
    lastOrderDays?: number; // Pelanggan yang memesan dalam X hari terakhir
    minOrderCount?: number; // Pelanggan dengan minimal X pesanan
    minTotalSpent?: number; // Pelanggan dengan minimal pengeluaran X
    lastActive?: number; // Pelanggan yang aktif dalam X hari terakhir
  };
  message: string;
  includeName?: boolean; // Sertakan nama pelanggan dalam pesan
  scheduleTime?: Date; // Opsional, jadwalkan pengiriman di waktu tertentu
}

/**
 * Interface untuk hasil broadcast
 */
export interface BroadcastResult {
  success: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  failedRecipients?: { id: string; phone: string; error: string }[];
  broadcastId?: string;
}

/**
 * Service untuk mengelola pesan broadcast WhatsApp ke pelanggan
 */
export class WhatsAppBroadcastService {
  /**
   * Mendapatkan daftar pelanggan berdasarkan filter yang dipilih
   */
  static async getRecipients(options: BroadcastOptions): Promise<{ id: string; phone: string; name?: string }[]> {
    let query = supabase.from('profiles').select('id, phone, name');

    // Jika tipe penerima adalah 'selected', filter berdasarkan ID yang dipilih
    if (options.recipientType === 'selected' && options.selectedIds && options.selectedIds.length > 0) {
      query = query.in('id', options.selectedIds);
    }
    // Jika tipe penerima adalah 'filtered', terapkan filter tambahan
    else if (options.recipientType === 'filtered' && options.filterOptions) {
      const { lastOrderDays, minOrderCount, minTotalSpent, lastActive } = options.filterOptions;

      // Filter berdasarkan aktivitas terakhir
      if (lastActive) {
        const lastActiveDate = new Date();
        lastActiveDate.setDate(lastActiveDate.getDate() - lastActive);
        query = query.gte('last_seen', lastActiveDate.toISOString());
      }

      // Untuk filter berdasarkan jumlah pesanan atau total pengeluaran, kita perlu gabungkan query
      // dengan tabel orders. Ini lebih kompleks dan bisa ditambahkan nanti.
    }

    // Filter untuk memastikan nomor telepon tersedia
    query = query.not('phone', 'is', null);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      phone: user.phone,
      name: user.name
    }));
  }

  /**
   * Mengirim pesan broadcast ke penerima yang dipilih
   */
  static async sendBroadcast(options: BroadcastOptions): Promise<BroadcastResult> {
    try {
      // 1. Mendapatkan daftar penerima
      const recipients = await this.getRecipients(options);

      if (recipients.length === 0) {
        return {
          success: false,
          totalRecipients: 0,
          sentCount: 0,
          failedCount: 0,
        };
      }

      console.log(`Preparing to send broadcast to ${recipients.length} recipients`);

      // 2. Menyimpan informasi broadcast ke database
      const { data: broadcastRecord, error: broadcastError } = await supabase
        .from('broadcasts')
        .insert({
          message_template: options.message,
          recipient_count: recipients.length,
          recipient_type: options.recipientType,
          scheduled_time: options.scheduleTime ? options.scheduleTime.toISOString() : null,
          created_at: new Date().toISOString(),
          status: options.scheduleTime ? 'scheduled' : 'sending'
        })
        .select()
        .single();

      if (broadcastError) {
        console.error('Error creating broadcast record:', broadcastError);
        return {
          success: false,
          totalRecipients: recipients.length,
          sentCount: 0,
          failedCount: recipients.length,
        };
      }

      const broadcastId = broadcastRecord.id;

      // 3. Jika dijadwalkan, simpan tugas dan kembalikan
      if (options.scheduleTime && options.scheduleTime > new Date()) {
        // Simpan daftar penerima untuk pengiriman terjadwal (implementasi tergantung arsitektur)
        await this.saveBroadcastRecipients(broadcastId, recipients);
        
        return {
          success: true,
          totalRecipients: recipients.length,
          sentCount: 0,
          failedCount: 0,
          broadcastId
        };
      }

      // 4. Kirim pesan ke semua penerima
      const results = await this.sendMessagesToRecipients(broadcastId, recipients, options);

      return {
        success: results.failedCount < recipients.length, // Sukses jika setidaknya satu pesan terkirim
        totalRecipients: recipients.length,
        sentCount: results.sentCount,
        failedCount: results.failedCount,
        failedRecipients: results.failedRecipients,
        broadcastId
      };
    } catch (error) {
      console.error('Error in sendBroadcast:', error);
      return {
        success: false,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
      };
    }
  }

  /**
   * Menyimpan daftar penerima untuk broadcast terjadwal
   */
  private static async saveBroadcastRecipients(
    broadcastId: string,
    recipients: { id: string; phone: string; name?: string }[]
  ) {
    const recipientRecords = recipients.map(recipient => ({
      broadcast_id: broadcastId,
      user_id: recipient.id,
      phone: recipient.phone,
      name: recipient.name || null,
      status: 'pending',
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('broadcast_recipients')
      .insert(recipientRecords);

    if (error) {
      console.error('Error saving broadcast recipients:', error);
    }
  }

  /**
   * Kirim pesan ke daftar penerima
   */
  private static async sendMessagesToRecipients(
    broadcastId: string,
    recipients: { id: string; phone: string; name?: string }[],
    options: BroadcastOptions
  ): Promise<{ sentCount: number; failedCount: number; failedRecipients: { id: string; phone: string; error: string }[] }> {
    let sentCount = 0;
    let failedCount = 0;
    const failedRecipients: { id: string; phone: string; error: string }[] = [];

    // Buat batches untuk menghindari rate limit (5 pesan dalam satu batch)
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    // Proses setiap batch secara berurutan
    for (let batch of batches) {
      const sendPromises = batch.map(async recipient => {
        try {
          // Personalisasi pesan jika diperlukan
          let personalizedMessage = options.message;
          if (options.includeName && recipient.name) {
            personalizedMessage = personalizedMessage.replace('{name}', recipient.name);
          } else {
            personalizedMessage = personalizedMessage.replace('{name}', 'Pelanggan');
          }

          // Kirim pesan WhatsApp
          const sent = await sendWatsapIdMessage(recipient.phone, personalizedMessage);

          // Catat hasil pengiriman
          await this.recordMessageSent(broadcastId, recipient.id, sent ? 'sent' : 'failed');

          if (sent) {
            sentCount++;
            return { success: true, recipient };
          } else {
            failedCount++;
            failedRecipients.push({ id: recipient.id, phone: recipient.phone, error: 'Failed to send' });
            return { success: false, recipient, error: 'Failed to send' };
          }
        } catch (error) {
          failedCount++;
          failedRecipients.push({ id: recipient.id, phone: recipient.phone, error: String(error) });
          await this.recordMessageSent(broadcastId, recipient.id, 'failed', String(error));
          return { success: false, recipient, error };
        }
      });

      // Tunggu semua pesan dalam batch selesai
      await Promise.all(sendPromises);
      
      // Tunggu 2 detik sebelum batch berikutnya untuk menghindari rate limit
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Update status broadcast
    await supabase
      .from('broadcasts')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', broadcastId);

    return { sentCount, failedCount, failedRecipients };
  }

  /**
   * Catat hasil pengiriman pesan
   */
  private static async recordMessageSent(
    broadcastId: string,
    userId: string,
    status: 'sent' | 'failed' | 'pending',
    error?: string
  ) {
    try {
      await supabase
        .from('broadcast_messages')
        .insert({
          broadcast_id: broadcastId,
          user_id: userId,
          status,
          error: error || null,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording message status:', error);
    }
  }

  /**
   * Mendapatkan riwayat broadcast
   */
  static async getBroadcastHistory(limit: number = 20, page: number = 1): Promise<any[]> {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching broadcast history:', error);
      return [];
    }

    return data;
  }

  /**
   * Mendapatkan detail broadcast tertentu
   */
  static async getBroadcastDetails(broadcastId: string) {
    const { data, error } = await supabase
      .from('broadcasts')
      .select(`
        *,
        broadcast_messages:broadcast_messages(
          user_id,
          status,
          sent_at,
          error
        )
      `)
      .eq('id', broadcastId)
      .single();

    if (error) {
      console.error('Error fetching broadcast details:', error);
      return null;
    }

    return data;
  }
}
