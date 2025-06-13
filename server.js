import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const DIGIFLAZZ_BASE_URL = 'https://api.digiflazz.com';

const generateSignature = (username, apiKey, value) => {
  return crypto.createHash('md5').update(username + apiKey + value).digest('hex');
};

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;
const secret = process.env.SECRET_WEBHOOK;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'Preflight request successful' });
  } else {
    next();
  }
});

app.use(bodyParser.json({ type: 'application/json' }));

// Store pending transactions for status checking
const pendingTransactions = new Map();

// Function to poll Digiflazz API for status updates
function pollDigiflazzStatus(refId, buyerTxId) {
  const interval = setInterval(async () => {
    try {
      console.log(`🔄 Polling status for ref_id: ${refId} or buyer_tx_id: ${buyerTxId}`);
      
      // Generate signature
      const signValue = `status_${refId || buyerTxId}`;
      const sign = crypto
        .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
        .update(signValue)
        .digest('hex');

      const response = await fetch(`https://api.digiflazz.com/v1/transaction-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: process.env.DIGIFLAZZ_USERNAME,
          sign: sign,
          ref_id: refId || buyerTxId 
        })
      });
      const result = await response.json();
      
      if (result.data && (result.data.status === 'berhasil' || result.data.status === 'gagal')) {
        console.log(`✅ Status updated to ${result.data.status} for ref_id: ${refId}`);
        const data = result.data;
        const { error } = await supabase.from('transaksi_digiflazz').insert([
          {
            ref_id: data.ref_id || refId,
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

// Digiflazz proxy endpoints
app.post('/digiflazz-proxy/:path(*)', async (req, res) => {
  try {
    console.log('🚀 Proxying request to Digiflazz');
    
    // Get request body
    const body = req.body || {};
    const path = req.params.path;

    if (!process.env.DIGIFLAZZ_USERNAME || !process.env.DIGIFLAZZ_API_KEY) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Missing Digiflazz credentials' 
      });
    }

    // Generate signature based on path and request
    const signValue = path === '/v1/transaction-history' ? 'history' : body.ref_id || body.command || '';
    const sign = generateSignature(process.env.DIGIFLAZZ_USERNAME, process.env.DIGIFLAZZ_API_KEY, signValue);

    const apiRequestBody = {
      username: process.env.DIGIFLAZZ_USERNAME,
      buyer_sku_code: body.buyer_sku_code,
      customer_no: body.customer_no,
      ref_id: body.ref_id,
      sign: sign
    };

    console.log('Payload dikirim ke Digiflazz:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch(`${DIGIFLAZZ_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Digiflazz API Error:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }

    const data = await response.json();

    // Special handling for PLN inquiry
    if (path.includes('/v1/inquiry-pln')) {
      return res.status(200).json({
        data: {
          status: data.data?.status || 'Gagal',
          message: data.data?.message || 'No message',
          customer_no: data.data?.customer_no || body.customer_no,
          meter_no: data.data?.meter_no || 'N/A',
          subscriber_id: data.data?.subscriber_id || 'N/A',
          name: data.data?.name || 'N/A',
          segment_power: data.data?.segment_power || 'N/A',
          rc: data.data?.rc || 'N/A'
        }
      });
    }

    console.log('✅ Digiflazz response:', data);
    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
});

app.post('/digiflazz-proxy/v1/transaction', async (req, res) => {
  try {
    console.log('🚀 Proxying transaction request to Digiflazz');
    
    // Get request body
    const body = req.body;
    
    // Generate signature
    const signValue = body.command || 'transaction';
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const response = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        command: body.command,
        customer_no: body.customer_no,
        buyer_sku_code: body.buyer_sku_code,
        sign: sign
      })
    });

    const result = await response.json();
    console.log('✅ Transaction response:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying transaction:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process transaction', data: {} });
  }
});

app.post('/digiflazz-proxy/v1/inquiry-pln', async (req, res) => {
  try {
    console.log('🚀 Proxying PLN inquiry request to Digiflazz');
    
    // Get request body
    const body = req.body;
    
    // Generate signature
    const signValue = body.command || 'inquiry';
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const response = await fetch('https://api.digiflazz.com/v1/inquiry-pln', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        command: body.command,
        customer_no: body.customer_no,
        sign: sign
      })
    });

    const result = await response.json();
    console.log('✅ PLN inquiry response:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying PLN inquiry:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process PLN inquiry', data: {} });
  }
});

app.post('/digiflazz-proxy/v1/price-list', async (req, res) => {
  try {
    console.log('🚀 Proxying price-list request to Digiflazz');
    
    // Get request body
    const body = req.body;
    
    // Generate signature based on request body
    const signValue = body.command || 'price-list';
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const response = await fetch('https://api.digiflazz.com/v1/price-list', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        command: body.command,
        sign: sign
      })
    });

    const result = await response.json();
    console.log('✅ Price-list response:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying price-list:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch price list', data: {} });
  }
});

app.post('/digiflazz-proxy/v1/transaction-history', async (req, res) => {
  try {
    console.log('🚀 Proxying transaction-history request to Digiflazz');
    console.log('Request body:', req.body);
    
    // Get request body
    const body = req.body;
    
    // Generate signature based on request body
    const signValue = body.command || 'history';
    console.log('Using sign value:', signValue);
    
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    console.log('Generated sign:', sign);

    const response = await fetch('https://api.digiflazz.com/v1/transaction-history', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        command: body.command,
        sign: sign
      })
    });

    const result = await response.json();
    console.log('✅ Transaction-history response:', result);
    
    // Check if response contains error
    if (result.status && result.status !== 'success') {
      console.error('❌ Digiflazz returned error:', result);
      return res.status(500).json({ 
        status: 'error', 
        message: result.message || 'Failed to fetch transaction history', 
        data: result.data || {} 
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying transaction-history:', error);
    
    // Try to get more details about the error
    if (error.response && error.response.data) {
      console.error('Error response:', error.response.data);
    }
    
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to fetch transaction history', 
      data: error.response?.data || {} 
    });
  }
});

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
  console.log(`🚀 Server berjalan di http://202.10.44.157:${port}`);
});
