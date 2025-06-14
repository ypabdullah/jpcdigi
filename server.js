import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import http from 'http';
import cron from 'node-cron';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import bodyParser from 'body-parser';

// Constants and utilities
const TRANSACTION_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  TIMEOUT: 'Timeout'
};

const REQUIRED_FIELDS = ['customer_no', 'buyer_sku_code', 'price'];

const DIGIFLAZZ_BASE_URL = 'https://api.digiflazz.com';

// Middleware and configurations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const validateTransactionData = (data) => {
  const missingFields = REQUIRED_FIELDS.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

const generateSignature = (username, apiKey, value) => {
  return crypto.createHmac('sha1', apiKey)
    .update(value)
    .digest('hex');
};

// Initialize app and configurations
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();

// Define port and other required variables
const port = process.env.PORT || 5173;
const secret = process.env.SECRET_WEBHOOK;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/digiflazz-proxy/v1/payload', bodyParser.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// PLN inquiry proxy
app.post('/digiflazz-proxy/v1/inquiry-pln', async (req, res) => {
  try {
    console.log('🚀 Proxying PLN inquiry request to Digiflazz');
    const body = req.body;
    console.log('Body:', JSON.stringify(body, null, 2));

    // Validate required fields
    try {
      validateTransactionData(body);
    } catch (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    // Generate signature
    const signValue = `inquiry-pln_${body.customer_no}`;
    const sign = crypto.createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    try {
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

      // Get response text first to avoid JSON parsing errors
      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);
        console.log('Digiflazz PLN inquiry response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          console.error(`❌ Digiflazz API returned status ${response.status}: ${JSON.stringify(data, null, 2)}`);
          return res.status(response.status).json({
            status: 'error',
            message: data.message || 'Failed to process request',
            data: data
          });
        }

        res.status(response.status).json(data);
      } catch (parseError) {
        console.error('❌ Error parsing Digiflazz API response:', parseError);
        console.error('Response text:', responseText);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse API response',
          error: parseError.message,
          response: responseText
        });
      }
    } catch (error) {
      console.error('❌ Error proxying PLN inquiry:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to proxy PLN inquiry request',
        error: error.message
      });
    }
  } catch (error) {
    console.error('❌ Error proxying PLN inquiry:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to proxy PLN inquiry request',
      error: error.message
    });
  }
});

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

    // Generate signature based on endpoint with proper command parameter
    const command = body.command || endpoint;
    let signValue = '';
    switch(command) {
      case 'price-list':
        signValue = 'price-list';
        break;
      case 'transaction-history':
        signValue = 'history';
        break;
      case 'cek-saldo':
        signValue = 'cek-saldo';
        break;
      case 'transaction':
        signValue = 'transaction';
        break;
      case 'inquiry-pln':
        signValue = `inquiry-pln_${body.customer_no}`;
        break;
      default:
        signValue = command;
    }

    // Generate HMAC SHA1 signature
    const sign = crypto.createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const apiRequestBody = {
      username: process.env.DIGIFLAZZ_USERNAME,
      sign: sign,
      command: command
    };

    // Validate transaction data
    try {
      validateTransactionData(body);
    } catch (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    // Add specific fields based on command
    switch(command) {
      case 'transaction':
        apiRequestBody.ref_id = body.ref_id || crypto.randomUUID();
        apiRequestBody.customer_no = body.customer_no;
        apiRequestBody.buyer_sku_code = body.buyer_sku_code;
        apiRequestBody.price = body.price;
        apiRequestBody.cmd = 'transaction';
        break;
      case 'inquiry-pln':
        apiRequestBody.customer_no = body.customer_no;
        apiRequestBody.cmd = 'inquiry-pln';
        break;
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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

// Webhook endpoint for Digiflazz
app.post('/digiflazz-proxy/v1/payload', async (req, res) => {
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
    res.status(500).json({ status: 'error', message: 'Failed to process webhook', error: error.message });
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

    // Generate signature with customer_no as per Digiflazz API requirements
    const signValue = `inquiry-pln_${body.customer_no}`;
    const sign = crypto.createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
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
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process PLN inquiry', 
      data: result 
    });
  }
});

app.post('/digiflazz-proxy/v1/transaction-history', async (req, res) => {
  try {
    console.log('🚀 Proxying transaction history request to Digiflazz');
    
    // Generate signature
    const refId = req.body.ref_id;
    const buyerTxId = req.body.buyerTxId;
    const signValue = `status_${refId || buyerTxId}`;
    const sign = crypto.createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
      .update(signValue)
      .digest('hex');

    const response = await fetch('https://api.digiflazz.com/v1/transaction-history', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: process.env.DIGIFLAZZ_USERNAME,
        sign: sign,
        ref_id: refId || buyerTxId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
    const sign = crypto.createHmac('sha1', process.env.DIGIFLAZZ_API_KEY)
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

function setupCronJobs() {
  try {
    // Check for pending transactions every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('⏰ Cron job running at:', new Date().toISOString());
        
        // Get pending transactions from Supabase
        const { data, error } = await supabase
          .from('transaksi_digiflazz')
          .select('*')
          .eq('status', 'Pending');

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
  } catch (err) {
    console.error('❌ Error setting up cron jobs:', err.message);
  }
}

// Initialize server and listen
const server = http.createServer(app);

// Start server only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`🚀 Server running at http://${process.env.HOST || '202.10.44.157'}:${port}`);
    setupCronJobs();
  });
}

// Export server for testing
export default server;
