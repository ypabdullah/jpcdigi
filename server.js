import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import cron from 'node-cron';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

// Transaction status constants
const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'berhasil',
  FAILED: 'gagal',
  TIMEOUT: 'timeout'
};

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Required fields validation
const REQUIRED_FIELDS = ['customer_no', 'buyer_sku_code', 'price'];

const validateTransactionData = (data) => {
  const missingFields = REQUIRED_FIELDS.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

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
    
    // Generate UUID for ref_id if not provided
    if (!body.ref_id) {
      const { data: { generate_uuid }, error } = await supabase
        .rpc('generate_uuid')
        .single();
      
      if (error) {
        console.error('❌ Error generating UUID:', error);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to generate unique transaction ID' 
        });
      }
      
      body.ref_id = generate_uuid;
    }
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

app.use(express.static(join(__dirname, 'public')));

// Serve static files from dist directory
app.use('/dist', express.static(join(__dirname, 'dist')));

// Digiflazz proxy endpoints
app.post('/digiflazz-proxy/v1/:endpoint', limiter, async (req, res) => {
  try {
    console.log('🚀 Proxying request to Digiflazz');
    console.log('Endpoint:', req.params.endpoint);
    console.log('Body:', req.body);
    
    // Get request body
    const body = req.body || {};
    const endpoint = req.params.endpoint;

    if (!process.env.DIGIFLAZZ_USERNAME || !process.env.DIGIFLAZZ_API_KEY) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Missing Digiflazz credentials' 
      });
    }

    // Generate signature based on endpoint
    let signValue = '';
    switch(endpoint) {
      case 'price-list':
        signValue = 'price-list';
        break;
      case 'transaction-history':
        signValue = 'history';
        break;
      case 'cek-saldo':
        signValue = 'cek-saldo';
        break;
      default:
        signValue = body.command || endpoint;
    }

    // Generate HMAC SHA1 signature
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const apiRequestBody = {
      username: process.env.DIGIFLAZZ_USERNAME,
      sign: sign
    };

    // Add specific fields based on endpoint
    if (endpoint === 'transaction') {
      apiRequestBody.ref_id = body.ref_id;
      apiRequestBody.customer_no = body.customer_no;
      apiRequestBody.buyer_sku_code = body.buyer_sku_code;
      apiRequestBody.price = body.price;
    }

    console.log('Sending request to Digiflazz:', {
      endpoint: endpoint,
      signValue: signValue,
      body: apiRequestBody
    });

    // Send request to Digiflazz API
    const response = await fetch(`https://api.digiflazz.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiRequestBody)
    });

    const result = await response.json();
    console.log('Digiflazz response:', result);

    res.status(response.status).json(result);
  } catch (error) {
    console.error('❌ Error proxying request:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to proxy request to Digiflazz',
      error: error.message 
    });
  }
});

// Webhook handler
app.post('/payload', limiter, async (req, res) => {
  try {
    console.log('📩 Webhook received:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Validate signature
    const signature = req.headers['x-digiflazz-signature'];
    if (!signature) {
      return res.status(400).json({ status: 'error', message: 'Missing signature' });
    }

    // Process webhook data
    const eventType = req.body.event || 'unknown';
    if (eventType === 'create') {
      // Insert or update transaction in Supabase
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .upsert([
          {
            ref_id: req.body.ref_id,
            customer_no: req.body.customer_no,
            buyer_sku_code: req.body.buyer_sku_code,
            status: req.body.status,
            message: req.body.message,
            rc: req.body.rc,
            sn: req.body.sn,
            price: req.body.price,
            buyer_last_saldo: req.body.buyer_last_saldo,
            tele: req.body.tele,
            wa: req.body.wa,
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Error saving webhook data:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to save webhook data' });
      }

      console.log('✅ Webhook data saved successfully');
    } else if (eventType === 'update') {
      // Update transaction status in Supabase
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .update({
          status: req.body.status,
          message: req.body.message,
          rc: req.body.rc,
          sn: req.body.sn,
          updated_at: new Date().toISOString()
        })
        .eq('ref_id', req.body.ref_id);

      if (error) {
        console.error('❌ Error updating webhook data:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update webhook data' });
      }

      console.log('✅ Webhook data updated successfully');
    }

    res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', data: {} });
  }
});

app.post('/digiflazz-proxy/v1/inquiry-pln', async (req, res) => {
  try {
    console.log('🚀 Proxying PLN inquiry request to Digiflazz');
    
    // Get request body
    const body = req.body;
    
    // Validate required fields
    try {
      validateTransactionData(body);
    } catch (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    // Generate signature
    const signValue = 'inquiry';
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
        command: 'inquiry-pln',
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

app.post('/digiflazz-proxy/v1/transaction-history', async (req, res) => {
  try {
    console.log('🚀 Proxying transaction history request to Digiflazz');
    
    // Generate signature
    const signValue = 'transaction-history';
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const response = await fetch('https://api.digiflazz.com/v1/transaction-history', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        sign: sign
      })
    });

    const result = await response.json();
    console.log('✅ Transaction history response:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying transaction history:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch transaction history', data: {} });
  }
});

app.post('/digiflazz-proxy/v1/cek-saldo', async (req, res) => {
  try {
    console.log('🚀 Proxying balance check request to Digiflazz');
    
    // Generate signature
    const signValue = 'cek-saldo';
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const response = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        sign: sign
      })
    });

    const result = await response.json();
    console.log('✅ Balance check response:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying balance check:', error);
    res.status(500).json({ status: 'error', message: 'Failed to check balance', data: {} });
  }
});

// Webhook handler
app.post('/payload', limiter, async (req, res) => {
  try {
    console.log('📩 Webhook received:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Validate signature
    const signature = req.headers['x-digiflazz-signature'];
    if (!signature) {
      return res.status(400).json({ status: 'error', message: 'Missing signature' });
    }

    // Process webhook data
    const eventType = req.body.event || 'unknown';
    if (eventType === 'create') {
      // Insert or update transaction in Supabase
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .upsert([
          {
            ref_id: req.body.ref_id,
            customer_no: req.body.customer_no,
            buyer_sku_code: req.body.buyer_sku_code,
            status: req.body.status,
            message: req.body.message,
            rc: req.body.rc,
            sn: req.body.sn,
            price: req.body.price,
            buyer_last_saldo: req.body.buyer_last_saldo,
            tele: req.body.tele,
            wa: req.body.wa,
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Error saving webhook data:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to save webhook data' });
      }

      console.log('✅ Webhook data saved successfully');
    } else if (eventType === 'update') {
      // Update transaction status in Supabase
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .update({
          status: req.body.status,
          message: req.body.message,
          rc: req.body.rc,
          sn: req.body.sn,
          updated_at: new Date().toISOString()
        })
        .eq('ref_id', req.body.ref_id);

      if (error) {
        console.error('❌ Error updating webhook data:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update webhook data' });
      }

      console.log('✅ Webhook data updated successfully');
    }

    res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error', data: {} });
  }
});

// Webhook test proxy route
app.post('/api/test-webhook-proxy', async (req, res) => {
  try {
    console.log('🚀 Forwarding webhook test to Digiflazz');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Forward request to Digiflazz
    const response = await fetch('https://api.digiflazz.com/v1/webhook-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIGIFLAZZ_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('Digiflazz webhook test response:', data);

    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error forwarding webhook test:', error);
    res.status(500).json({ status: 'error', message: 'Failed to forward webhook test', data: {} });
  }
});
    const response = await fetch('https://api.digiflazz.com/v1/webhook-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIGIFLAZZ_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('Digiflazz webhook test response:', data);

    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error forwarding webhook test:', error);
    res.status(500).json({ status: 'error', message: 'Failed to forward webhook test', data: {} });
  }
});

const setupCronJobs = () => {
  // Cron job untuk memeriksa transaksi pending
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏱️ Running cron job to check pending transactions');
    
    try {
      // Get all pending transactions
      const { data: pending, error: fetchError } = await supabase
        .from('transaksi_digiflazz')
        .select('*')
        .eq('status', TRANSACTION_STATUS.PENDING);

      if (fetchError) {
        console.error('❌ Error fetching pending transactions:', fetchError);
        return;
      }

      if (!pending || pending.length === 0) {
        console.log('✅ No pending transactions to check');
        return;
      }

      console.log(`🔄 Checking ${pending.length} pending transactions`);

      // Check each pending transaction
      for (const tx of pending) {
        try {
          await pollDigiflazzStatus(tx.ref_id);
        } catch (error) {
          console.error(`❌ Error checking transaction ${tx.ref_id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in cron job:', error);
    }
  });

  // Cron job untuk membersihkan transaksi timeout
  cron.schedule('0 * * * *', async () => {
    console.log('⏱️ Running cron job to clean up timeout transactions');
    
    try {
      // Get all transactions that have exceeded the 1 hour limit
      const { data: timeoutTx, error: fetchError } = await supabase
        .from('transaksi_digiflazz')
        .select('*')
        .eq('status', TRANSACTION_STATUS.PENDING)
        .lt('created_at', new Date(Date.now() - 3600000)) // 1 hour ago
        .timeout(10000); // 10 second timeout

      if (fetchError) {
        console.error('❌ Error fetching timeout transactions:', fetchError);
        return;
      }

      if (!timeoutTx || timeoutTx.length === 0) {
        console.log('✅ No timeout transactions to handle');
        return;
      }

      console.log(`⏰ Found ${timeoutTx.length} timeout transactions`);

      // Update status to timeout
      for (const tx of timeoutTx) {
        try {
          const { error: updateError } = await supabase
            .from('transaksi_digiflazz')
            .update({
              status: TRANSACTION_STATUS.TIMEOUT,
              message: 'Transaction timeout (exceeded 1 hour)'
            })
            .eq('ref_id', tx.ref_id);

          if (updateError) {
            console.error(`❌ Error updating timeout status for ${tx.ref_id}:`, updateError);
          }
        } catch (error) {
          console.error(`❌ Error handling timeout for ${tx.ref_id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error in timeout cron job:', error);
    }
  });

  // Cron job untuk memperbarui harga produk (daily at 3:00 AM)
  cron.schedule('0 3 * * *', async () => {
    console.log('⏱️ Running cron job to update product prices');
    
    try {
      // Generate signature
      const signValue = 'price-list';
      const sign = crypto
        .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
        .update(signValue)
        .digest('hex');

      const response = await fetch(`${DIGIFLAZZ_BASE_URL}/v1/price-list`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: process.env.DIGIFLAZZ_USERNAME,
          sign: sign
        })
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        // Update or insert prices in Supabase
        const { error: updateError } = await supabase
          .from('ppob_products')
          .upsert(result.data.map(item => ({
            sku_code: item.sku_code,
            name: item.name,
            price: item.price,
            description: item.description,
            updated_at: new Date().toISOString()
          })));

        if (updateError) {
          console.error('❌ Error updating product prices:', updateError);
        } else {
          console.log('✅ Product prices successfully updated');
        }
      } else {
        console.error('❌ Failed to fetch price list:', result.message || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ Error in price list cron job:', error);
    }
  });
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`🚀 Server running at http://${process.env.HOST || '202.10.44.157'}:${port}`);
  setupCronJobs();
});

module.exports = server;
