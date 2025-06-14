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
import rateLimit from 'express-rate-limit';

// Transaction status constants
const TRANSACTION_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Berhasil',
  FAILED: 'Gagal',
  TIMEOUT: 'Timeout'
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

// Body parser
app.use(bodyParser.json({ type: 'application/json' }));

// Serve static files from the dist directory
app.use(express.static('dist'));

// Webhook endpoint
app.post('/payload', limiter, async (req, res) => {
  try {
    console.log('📩 Webhook received:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Verify signature
    const signature = req.headers['x-digiflazz-signature'];
    if (!signature) {
      console.error('❌ Missing signature header');
      return res.status(401).json({ status: 'error', message: 'Missing signature' });
    }

    // Get the raw body for signature verification
    const rawBody = await new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
    });

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha1', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid signature');
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }

    // Handle webhook data
    const eventType = req.headers['x-digiflazz-event'];
    if (eventType === 'create') {
      // Save transaction in Supabase
      const { error } = await supabase
        .from('transaksi_digiflazz')
        .insert([
          {
            ref_id: req.body.ref_id,
            customer_no: req.body.customer_no,
            buyer_sku_code: req.body.buyer_sku_code,
            status: req.body.status,
            message: req.body.message,
            rc: req.body.rc,
            sn: req.body.sn,
            buyer_last_saldo: req.body.buyer_last_saldo,
            tele: req.body.tele,
            wa: req.body.wa,
            transaction_date: new Date().toISOString()
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

// PLN inquiry proxy
app.post('/digiflazz-proxy/v1/inquiry-pln', async (req, res) => {
  try {
    console.log('🚀 Proxying PLN inquiry request to Digiflazz');
    
    // Get request body
    const body = req.body;
    console.log('Body:', JSON.stringify(body, null, 2));

    // Generate signature
    const signValue = `inquiry-pln_${body.customer_no}`;
    const sign = crypto
      .createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    // Forward request to Digiflazz
    const response = await fetch(`${DIGIFLAZZ_BASE_URL}/v1/inquiry-pln`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        sign: sign,
        customer_no: body.customer_no
      })
    });

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Digiflazz API returned status ${response.status}: ${errorText}`);
      return res.status(response.status).json({
        status: 'error',
        message: errorText
      });
    }

    const data = await response.json();
    console.log('Digiflazz PLN inquiry response:', JSON.stringify(data, null, 2));

    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Error proxying PLN inquiry:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to proxy PLN inquiry request'
    });
  }
});

// Catch-all route for serving the main application page
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

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
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          username: process.env.DIGIFLAZZ_USERNAME,
          sign: sign,
          ref_id: refId || buyerTxId,
          cmd: 'status' // Adding cmd parameter as per Digiflazz API requirements
        })
      });

      // Check response status before parsing
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Digiflazz API returned status ${response.status}: ${errorText}`);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Digiflazz API response:', JSON.stringify(result, null, 2));

      if (result.status === 'success' && result.data && (result.data.status === 'berhasil' || result.data.status === 'gagal')) {
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

function setupCronJobs() {
    // Cron ini akan jalan tiap 1 menit
    cron.schedule('*/1 * * * *', async () => {
      console.log('⏰ Running polling job: checking pending transactions');
  
      try {
        const { data, error } = await supabase
          .from('transaksi_digiflazz')
          .select('ref_id, buyer_sku_code')
          .eq('status', TRANSACTION_STATUS.PENDING);
  
        if (error) {
          console.error('❌ Error fetching pending transactions:', error.message);
          return;
        }
  
        if (!data || data.length === 0) {
          console.log('✅ No pending transactions found');
          return;
        }
  
        console.log(`🔍 Found ${data.length} pending transactions. Polling now...`);
  
        for (const tx of data) {
          if (tx.ref_id) {
            await pollDigiflazzStatus(tx.ref_id, tx.buyer_sku_code || null);
          }
        }
      } catch (err) {
        console.error('❌ Cron job error:', err.message);
      }
    });
  }
  
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`🚀 Server running at http://${process.env.HOST || '202.10.44.157'}:${port}`);
  setupCronJobs();
});

export default server;
