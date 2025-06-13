import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;
const secret = process.env.SECRET_WEBHOOK;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.json({ type: 'application/json' }));

// Store pending transactions for status checking
const pendingTransactions = new Map();

// Function to poll Digiflazz API for status updates
function pollDigiflazzStatus(refId, buyerTxId) {
  const interval = setInterval(async () => {
    try {
      console.log(`🔄 Polling status for ref_id: ${refId} or buyer_tx_id: ${buyerTxId}`);
      const response = await fetch(`https://api.digiflazz.com/v1/transaction-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: process.env.DIGIFLAZZ_USERNAME,
          api_key: process.env.DIGIFLAZZ_API_KEY,
          ref_id: refId || buyerTxId 
        })
      });
      const result = await response.json();
      
      if (result.data && (result.data.status === 'berhasil' || result.data.status === 'gagal')) {
        console.log(`✅ Status updated to ${result.data.status} for ref_id: ${refId}`);
        const data = result.data;
        const { error } = await supabase.from('transaksi_digiflazz').insert([
          {
            ref_id_internal: data.buyer_tx_id || buyerTxId,
            ref_id_digiflazz: data.ref_id || refId,
            customer_no: data.customer_no,
            buyer_sku_code: data.buyer_sku_code,
            status: data.status,
            message: data.message,
            rc: data.rc,
            sn: data.sn,
            price: data.price,
            buyer_last_saldo: data.buyer_last_saldo,
            tele: data.tele,
            wa: data.wa,
            transaction_date: new Date().toISOString()
          }
        ]);

        if (error) {
          console.error('❌ Error saving to Supabase after polling:', error.message);
        } else {
          console.log('✅ Transaction saved to Supabase after polling');
        }
        clearInterval(interval);
        pendingTransactions.delete(refId || buyerTxId);
      } else {
        console.log(`⏳ Status still pending for ref_id: ${refId}`);
      }
    } catch (err) {
      console.error('❌ Error polling Digiflazz API:', err.message);
    }
  }, 30000); // Poll every 30 seconds

  setTimeout(() => {
    if (pendingTransactions.has(refId || buyerTxId)) {
      console.log(`⏰ Polling timeout for ref_id: ${refId}`);
      clearInterval(interval);
      pendingTransactions.delete(refId || buyerTxId);
    }
  }, 3600000); // Timeout after 1 hour
}

app.use(express.static(join(__dirname, 'dist')));

app.post('/payload', async (req, res) => {
  try {
    console.log('📩 Webhook diterima:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const eventType = req.body.event || 'unknown';
    console.log('Event Type:', eventType);

    // Validate signature
    const signature = req.headers['x-digiflazz-signature'];
    if (!signature) {
      console.error('❌ Tidak ada signature di header');
      return res.status(401).json({ status: 'error', message: 'No signature provided', data: {} });
    }

    const computedSignature = crypto
      .createHmac('sha1', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (computedSignature !== signature) {
      console.error('❌ Signature tidak valid:', computedSignature, '!=', signature);
      return res.status(401).json({ status: 'error', message: 'Invalid signature', data: {} });
    }

    console.log('✅ Signature valid');

    if (!req.body.data) {
      console.error('❌ No data in payload');
      return res.status(400).json({ status: 'error', message: 'No data in payload', data: {} });
    }

    const data = req.body.data;
    const transactionId = data.ref_id;

    if (!transactionId) {
      console.error('❌ Missing transaction identifier');
      return res.status(400).json({ status: 'error', message: 'Missing transaction identifier', data: {} });
    }

    // Handle create event
    if (eventType === 'create') {
      console.log('📥 Create event received from Digiflazz');
      
      // Check if transaction already exists
      const { data: existingTx, error: checkError } = await supabase
        .from('transaksi_digiflazz')
        .select('*')
        .eq('ref_id', data.ref_id)
        .single();

      if (checkError) {
        console.error('❌ Error checking existing transaction:', checkError.message);
        return res.status(500).json({ status: 'error', message: 'Database error', data: {} });
      }

      if (existingTx) {
        console.log('🔄 Transaction already exists, updating status');
        // Update existing transaction
        const { error: updateError } = await supabase
          .from('transaksi_digiflazz')
          .update({
            status: data.status,
            message: data.message,
            rc: data.rc,
            sn: data.sn || '',
            updated_at: new Date().toISOString()
          })
          .eq('ref_id', data.ref_id);

        if (updateError) {
          console.error('❌ Error updating transaction:', updateError.message);
          return res.status(500).json({ status: 'error', message: 'Failed to update transaction', data: {} });
        }

        console.log('✅ Transaction updated successfully');
        return res.status(200).json({ status: 'success', message: 'Transaction updated', data: {} });
      }

      // Insert new transaction
      const { error: insertError } = await supabase.from('transaksi_digiflazz').insert([
        {
          ref_id: data.ref_id,
          customer_no: data.customer_no,
          buyer_sku_code: data.buyer_sku_code,
          status: data.status,
          message: data.message,
          rc: data.rc,
          sn: data.sn || '',
          price: data.price,
          buyer_last_saldo: data.buyer_last_saldo,
          tele: data.tele,
          wa: data.wa,
          transaction_date: new Date().toISOString()
        }
      ]);

      if (insertError) {
        console.error('❌ Error saving to Supabase:', insertError.message);
        return res.status(500).json({ status: 'error', message: 'Failed to save transaction', data: {} });
      }

      console.log('✅ Transaction created in Supabase');
      return res.status(200).json({ status: 'success', message: 'Transaction created', data: {} });
    }

    // Handle update event
    if (eventType === 'update') {
      console.log('🔁 Webhook update diterima');
      
      // Update existing transaction
      const { error: updateError } = await supabase
        .from('transaksi_digiflazz')
        .update({
          status: data.status,
          message: data.message,
          rc: data.rc,
          sn: data.sn || '',
          updated_at: new Date().toISOString()
        })
        .eq('ref_id', data.ref_id);

      if (updateError) {
        console.error('❌ Error updating transaction:', updateError.message);
        return res.status(500).json({ status: 'error', message: 'Failed to update transaction', data: {} });
      }

      console.log('✅ Transaction updated successfully');
      return res.status(200).json({ status: 'success', message: 'Transaction updated', data: {} });
    }

    // Handle unknown event type
    console.warn('⚠️ Unknown event type:', eventType);
    return res.status(200).json({ status: 'warning', message: 'Unknown event type', data: {} });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error', data: {} });
  }
});

// Webhook test proxy route
app.post('/api/test-webhook-proxy', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed', data: {} });
  }

  try {
    const { data: webhookData } = req.body;
    console.log('🚀 Forwarding webhook test to Digiflazz:', webhookData);
    
    const response = await fetch('https://api.digiflazz.com/v1/transaction-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    console.log('✅ Webhook test response:', result);
    
    res.status(200).json({ status: 'success', message: 'Webhook test forwarded', data: result });
  } catch (error) {
    console.error('❌ Error forwarding webhook test:', error);
    res.status(500).json({ status: 'error', message: 'Failed to forward webhook test', data: {} });
  }
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
