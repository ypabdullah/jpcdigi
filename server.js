import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;
const secret = process.env.SECRET_WEBHOOK;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.json());

// Store pending transactions for status checking
const pendingTransactions = new Map();

// Webhook endpoint
// Middleware untuk verifikasi IP
const allowedIPs = ['52.74.250.133']; // IP Digiflazz

const verifyIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    console.error(`❌ IP tidak diizinkan: ${clientIP}`);
    return res.status(403).json({ error: 'IP not allowed' });
  }
  console.log(`✅ IP valid: ${clientIP}`);
  next();
};

// Webhook endpoint
app.post('/payload', verifyIP, async (req, res) => {
  try {
    console.log('📩 Webhook diterima:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Verify webhook signature
    const signature = req.headers['x-hub-signature'];
    if (!signature) {
      console.error('❌ No signature header');
      res.status(400).json({ error: 'No signature header' });
      return;
    }

    // Extract the signature from the header (format: sha1=xxxx)
    const [algo, hash] = signature.split('=');
    if (algo !== 'sha1') {
      console.error('❌ Invalid signature algorithm');
      res.status(400).json({ error: 'Invalid signature algorithm' });
      return;
    }

    // Get the raw body
    const body = JSON.stringify(req.body);
    
    // Generate our own signature
    const expectedHash = crypto
      .createHmac('sha1', process.env.SECRET_WEBHOOK || 'jpcdigi')
      .update(body)
      .digest('hex');

    // Compare signatures
    if (hash !== expectedHash) {
      console.error('❌ Invalid signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Process the event
    const eventType = req.headers['x-digiflazz-event'];
    if (!eventType) {
      console.error('❌ No event type');
      res.status(400).json({ error: 'No event type' });
      return;
    }

    console.log('🎯 Event type:', eventType);
    console.log('📦 Event data:', req.body);

    // Handle different event types
    if (req.body.data) {
      const data = req.body.data;
      console.log('📥 Event data:', {
        ref_id: data.ref_id,
        status: data.status,
        rc: data.rc,
        message: data.message
      });

      if (eventType === 'create') {
        console.log('📥 Create event received from Digiflazz');
        
        // Insert or update transaction
        const { data: existingTx, error: fetchError } = await supabase
          .from('transaksi_digiflazz')
          .select('*')
          .eq('ref_id', data.ref_id)
          .single();

        if (fetchError) {
          console.error('❌ Error checking existing transaction:', fetchError.message);
          res.status(500).json({ error: 'Failed to check existing transaction' });
          return;
        }

        if (!existingTx) {
          // Insert new transaction
          const { error: insertError } = await supabase
            .from('transaksi_digiflazz')
            .insert([{
              ref_id: data.ref_id,
              customer_no: data.customer_no,
              buyer_sku_code: data.buyer_sku_code,
              status: data.status,
              message: data.message,
              rc: data.rc,
              buyer_last_saldo: data.buyer_last_saldo,
              sn: data.sn,
              price: data.price,
              tele: data.tele,
              wa: data.wa,
              description: data.description
            }]);

          if (insertError) {
            console.error('❌ Error inserting transaction:', insertError.message);
            res.status(500).json({ error: 'Failed to insert transaction' });
            return;
          }

          console.log('✅ New transaction inserted:', data.ref_id);
        } else {
          // Update existing transaction
          const { error: updateError } = await supabase
            .from('transaksi_digiflazz')
            .update({
              status: data.status,
              message: data.message,
              rc: data.rc,
              buyer_last_saldo: data.buyer_last_saldo,
              sn: data.sn,
              price: data.price,
              tele: data.tele,
              wa: data.wa,
              description: data.description
            })
            .eq('id', existingTx.id);

          if (updateError) {
            console.error('❌ Error updating transaction:', updateError.message);
            res.status(500).json({ error: 'Failed to update transaction' });
            return;
          }

          console.log('✅ Transaction updated:', data.ref_id);
        }
      } else if (eventType === 'update') {
        console.log('🔁 Webhook update diterima');
        console.log('📌 Data update:', {
          ref_id: data.ref_id,
          status: data.status,
          rc: data.rc,
          message: data.message
        });

        // Update transaction status
        const { data: existingTx, error: fetchError } = await supabase
          .from('transaksi_digiflazz')
          .select('*')
          .eq('ref_id', data.ref_id)
          .single();

        if (fetchError) {
          console.error('❌ Error checking existing transaction:', fetchError.message);
          res.status(500).json({ error: 'Failed to check existing transaction' });
          return;
        }

        if (!existingTx) {
          console.error('❌ Transaction not found for update');
          res.status(404).json({ error: 'Transaction not found' });
          return;
        }

        const { error: updateError } = await supabase
          .from('transaksi_digiflazz')
          .update({
            status: data.status,
            message: data.message,
            rc: data.rc,
            buyer_last_saldo: data.buyer_last_saldo,
            sn: data.sn,
            price: data.price,
            tele: data.tele,
            wa: data.wa,
            description: data.description
          })
          .eq('ref_id', existingTx.ref_id);

        if (updateError) {
          console.error('❌ Error updating transaction:', updateError.message);
          res.status(500).json({ error: 'Failed to update transaction' });
          return;
        }

        console.log('✅ Transaction status updated');
      }
    } else {
      console.error('❌ No data in payload');
      res.status(400).json({ error: 'No data in payload' });
      return;
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('❌ Error processing webhook:', err.message);
    res.status(500).json({ error: 'Request failed', detail: err.message });
  }
});
      .update(body)
      .digest('hex');

    // Compare signatures
    if (hash !== expectedHash) {
      console.error('❌ Invalid signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Process the event
    const eventType = req.headers['x-digiflazz-event'];
    if (!eventType) {
      console.error('❌ No event type');
      res.status(400).json({ error: 'No event type' });
      return;
    }

    console.log('🎯 Event type:', eventType);
    console.log('📦 Event data:', req.body);

    // Handle different event types
    if (req.body.data) {
      const data = req.body.data;
      console.log('📥 Event data:', {
        ref_id: data.ref_id,
        status: data.status,
        rc: data.rc,
        sn: data.sn,
        description: data.description,
        message: data.message
      });

      if (eventType === 'create') {
        console.log('📥 Create event received from Digiflazz');
        
        // Insert or update transaction
        const { data: existingTx, error: fetchError } = await supabase
          .from('transaksi_digiflazz')
          .select('ref_id')
          .eq('ref_id', data.ref_id)
          .single();

        if (fetchError) {
          console.error('❌ Error checking existing transaction:', fetchError.message);
          res.status(500).json({ error: 'Failed to check existing transaction' });
          return;
        }

        if (!existingTx) {
          // Insert new transaction
          const { error: insertError } = await supabase
            .from('transaksi_digiflazz')
            .insert([{
              ref_id: data.ref_id,
              customer_no: data.customer_no,
              buyer_sku_code: data.buyer_sku_code,
              status: data.status,
              message: data.message,
              rc: data.rc,
              buyer_last_saldo: data.buyer_last_saldo,
              sn: data.sn,
              price: data.price,
              tele: data.tele,
              wa: data.wa
            }]);

          if (insertError) {
            console.error('❌ Error inserting transaction:', insertError.message);
            res.status(500).json({ error: 'Failed to insert transaction' });
            return;
          }

          console.log('✅ New transaction inserted:', data.ref_id);
        } else {
          // Update existing transaction
          const { error: updateError } = await supabase
            .from('transaksi_digiflazz')
            .update({
              status: data.status,
              message: data.message,
              rc: data.rc,
              buyer_last_saldo: data.buyer_last_saldo,
              sn: data.sn,
              price: data.price,
              tele: data.tele,
              wa: data.wa
            })
            .eq('ref_id', existingTx.ref_id);

          if (updateError) {
            console.error('❌ Error updating transaction:', updateError.message);
            res.status(500).json({ error: 'Failed to update transaction' });
            return;
          }

          console.log('✅ Transaction updated:', data.ref_id);
        }
      } else if (eventType === 'update') {
        console.log('🔁 Webhook update diterima');
        console.log('📌 Data update:', {
          ref_id: data.ref_id,
          status: data.status,
          rc: data.rc,
          message: data.message
        });

        // Update transaction status
        const { data: existingTx, error: fetchError } = await supabase
          .from('transaksi_digiflazz')
          .select('*')
          .eq('ref_id', data.ref_id)
          .single();

        if (fetchError) {
          console.error('❌ Error checking existing transaction:', fetchError.message);
          res.status(500).json({ error: 'Failed to check existing transaction' });
          return;
        }

        if (!existingTx) {
          console.error('❌ Transaction not found for update');
          res.status(404).json({ error: 'Transaction not found' });
          return;
        }

        const { error: updateError } = await supabase
          .from('transaksi_digiflazz')
          .update({
            status: data.status,
            message: data.message,
            rc: data.rc,
            buyer_last_saldo: data.buyer_last_saldo,
            sn: data.sn,
            price: data.price,
            tele: data.tele,
            wa: data.wa
          })
          .eq('ref_id', existingTx.ref_id);

        if (updateError) {
          console.error('❌ Error updating transaction:', updateError.message);
          res.status(500).json({ error: 'Failed to update transaction' });
          return;
        }

        console.log('✅ Transaction status updated');
      }
    } else {
      console.error('❌ No data in payload');
      res.status(400).json({ error: 'No data in payload' });
      return;
    }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('❌ Error processing webhook:', err.message);
    res.status(500).json({ error: 'Request failed', detail: err.message });
  }
});

// Function to check and update pending transactions
async function checkPendingTransactions() {
  try {
    console.log('🔄 Checking pending transactions...');
    
    // Get all pending transactions from database
    const { data: pendingTx, error: fetchError } = await supabase
      .from('transaksi_digiflazz')
      .select('*')
      .in('status', ['Pending', 'pending'])
      .not('ref_id', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching pending transactions:', fetchError.message);
      console.error('❌ Detailed error:', fetchError.details);
      return;
    }

    if (!pendingTx || pendingTx.length === 0) {
      console.log('✅ No pending transactions found');
      return;
    }

    console.log(`🔍 Found ${pendingTx.length} pending transactions to check`);
    console.log('📊 List of pending transactions:');
    pendingTx.forEach(tx => {
      console.log(`  - ref_id: ${tx.ref_id}, status: ${tx.status}`);
    });

    if (fetchError) {
      console.error('❌ Error fetching pending transactions:', fetchError.message);
      return;
    }

    if (!pendingTx || pendingTx.length === 0) {
      console.log('✅ No pending transactions found');
      return;
    }

    console.log(`🔍 Found ${pendingTx.length} pending transactions to check`);
    console.log('📊 List of pending transactions:');
    pendingTx.forEach(tx => {
      console.log(`  - ref_id: ${tx.ref_id}, status: ${tx.status}`);
    });

    // Check each pending transaction
    for (const tx of pendingTx) {
      try {
        console.log(`🔄 Checking transaction ${tx.ref_id}`);
        console.log('🔍 Transaction details:', {
          ref_id: tx.ref_id,
          customer_no: tx.customer_no,
          buyer_sku_code: tx.buyer_sku_code,
          status: tx.status,
          sn: tx.sn,
          price: tx.price,
          tele: tx.tele,
          wa: tx.wa,
          buyer_last_saldo: tx.buyer_last_saldo,
          description: tx.description
          
        });
        
        try {
          const apiUrl = 'https://api.digiflazz.com/v1/transaction';
          console.log(`🔍 Checking transaction status at ${apiUrl}`);
          
          
          // Generate signature for API request
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const username = process.env.DIGIFLAZZ_USERNAME || 'vatuviWmrQGg';
          const apiKey = process.env.DIGIFLAZZ_API_KEY || 'd5271510-8de5-5767-b6cb-b252090c57ae';

          // Sort parameters alphabetically
          const params = [
            `api_key=${apiKey}`,
            `ref_id=${tx.ref_id}`,
            `timestamp=${timestamp}`,
            `username=${username}`
          ].sort().join('&');

          // Generate signature using sorted parameters
          const signature = crypto.createHash('sha256')
            .update(params)
            .digest('hex');

          // Log signature details
          console.log('🔒 Signature details:', {
            username,
            api_key: apiKey,
            ref_id: tx.ref_id,
            timestamp,
            signature,
            params: params, // Show the sorted params string
            sortedParams: params // For verification
          });

          // Log request payload
          const payload = {
            username: process.env.DIGIFLAZZ_USERNAME || 'vatuviWmrQGg',
            ref_id: tx.ref_id,
            timestamp: timestamp,
            signature: signature
          };
          console.log('📦 Request payload:', payload);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          // Log response status
          console.log('📊 Response status:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });

          // Get response text first before parsing as JSON
          const responseText = await response.text();
          console.log('📋 Raw response:', responseText);

          // Try to parse as JSON
          let result;
          try {
            result = JSON.parse(responseText);
            console.log('📊 Parsed JSON:', result);
          } catch (parseErr) {
            console.error('❌ Error parsing JSON:', parseErr.message);
            console.log('📋 Raw response:', responseText);
            throw new Error(`Failed to parse response as JSON: ${parseErr.message}`);
          }

          if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            console.error('❌ Response:', responseText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }

          // Log final result
          console.log('📊 API Response:', {
            status: response.status,
            statusText: response.statusText,
            data: result
          });

          return result;
        } catch (err) {
          console.error(`❌ Error calling Digiflazz API for ref_id: ${tx.ref_id}`);
          console.error('❌ Error details:', err.message);
          console.error('❌ Stack trace:', err.stack);
          throw err;
        }

        if (result.data && (result.data.status === 'berhasil' || result.data.status === 'gagal')) {
          console.log(`✅ Status updated to ${result.data.status} for ref_id: ${tx.ref_id}`);
          console.log('📊 Update details:', {
            status: result.data.status,
            message: result.data.message,
            rc: result.data.rc,
            sn: result.data.sn,
            saldo: result.data.buyer_last_saldo
          });
          
          // Update transaction in database
          const { error: updateError } = await supabase
            .from('transaksi_digiflazz')
            .update({
              status: result.data.status,
              message: result.data.message || '',
              rc: result.data.rc || '',
              sn: result.data.sn || '',
              buyer_last_saldo: result.data.buyer_last_saldo || 0
            })
            .eq('id', tx.id);

          if (updateError) {
            console.error('❌ Error updating transaction:', updateError.message);
            console.error('❌ Detailed error:', updateError.details);
          } else {
            console.log(`✅ Transaction ${tx.ref_id} (ID: ${tx.id}) updated successfully`);
          }
        } else {
          console.log(`⏳ Status still pending for ref_id: ${tx.ref_id}`);
          console.log('📊 Current status:', {
            status: result.data ? result.data.status : 'unknown',
            message: result.data ? result.data.message : 'No response from API'
          });
        }
      } catch (err) {
        console.error(`❌ Error checking transaction ${tx.ref_id} (ID: ${tx.id}):`, err.message);
        console.error('❌ Detailed error:', err.stack);
      }
    }
  } catch (err) {
    console.error('❌ Error in checkPendingTransactions:', err.message);
    console.error('❌ Detailed error:', err.stack);
  }
}

// Schedule cron job to run every 1 minute
const job = cron.schedule('*/1 * * * *', async () => {
  console.log(`⏰ Cron job started: ${new Date().toISOString()}`);
  try {
    await checkPendingTransactions();
    console.log('✅ Cron job completed successfully');
  } catch (error) {
    console.error('❌ Cron job failed:', error.message);
    console.error('❌ Detailed error:', error.stack);
  }
});

// Log when server starts
console.log(`🚀 Server started on http://192.168.18.15:${port}`);
console.log('⏰ Cron job is running every 1 minute');

// Function to poll Digiflazz API for status updates
function pollDigiflazzStatus(refId, buyerTxId) {
  const interval = setInterval(async () => {
    try {
      console.log(`🔄 Polling status for ref_id: ${refId} or buyer_tx_id: ${buyerTxId}`);
      // Replace with actual API call to Digiflazz to check status
      // This is a placeholder for the API request
      const response = await fetch(`https://api.digiflazz.com/v1/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: process.env.DIGIFLAZZ_USERNAME || 'vatuviWmrQGg',
          api_key: process.env.DIGIFLAZZ_API_KEY || 'd5271510-8de5-5767-b6cb-b252090c57ae',
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
            buyer_tx_id: data.buyer_tx_id || buyerTxId,
            customer_no: data.customer_no || '',
            buyer_sku_code: data.buyer_sku_code || '',
            status: data.status,
            message: data.message || '',
            rc: data.rc || '',
            sn: data.sn || '',
            price: data.price || 0,
            buyer_last_saldo: data.buyer_last_saldo || 0,
            tele: data.tele || '',
            wa: data.wa || ''
          }
        ]);

        if (error) {
          console.error('❌ Error saving to Supabase after polling:', error.message);
          console.error('📛 Detailed Error:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Transaction saved to Supabase after polling');
          console.log('🧾 Data inserted:', JSON.stringify(data, null, 2));
        }
        clearInterval(interval);
        pendingTransactions.delete(refId || buyerTxId);
      } else {
        console.log(`⏳ Status still pending for ref_id: ${refId}`);
      }
    } catch (err) {
      console.error('❌ Error polling Digiflazz API:', err.message);
      console.error('📛 Detailed Error:', JSON.stringify(err, null, 2));
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

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Digiflazz proxy endpoints
app.post('/digiflazz-proxy/v1/price-list', async (req, res) => {
  try {
    const { username, apiKey } = req.body;
    if (!username || !apiKey) {
      return res.status(400).json({ error: 'Username and API key are required' });
    }

    const response = await fetch('https://api.digiflazz.com/api/v1/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        api_key: apiKey
      }),
    });

    if (!response.ok) {
      throw new Error(`Digiflazz API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Digiflazz products:', error);
    res.status(500).json({ error: 'Failed to fetch Digiflazz products' });
  }
});

app.post('/digiflazz-proxy/v1/cek-saldo', async (req, res) => {
  try {
    const { username, apiKey } = req.body;
    if (!username || !apiKey) {
      return res.status(400).json({ error: 'Username and API key are required' });
    }

    const response = await fetch('https://api.digiflazz.com/api/v1/balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        api_key: apiKey
      }),
    });

    if (!response.ok) {
      throw new Error(`Digiflazz API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error checking Digiflazz balance:', error);
    res.status(500).json({ error: 'Failed to check Digiflazz balance' });
  }
});

// Webhook endpoint
app.post('/payload', async (req, res) => {
  console.log('📩 Webhook diterima:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const eventType = req.body.event || 'unknown';
  console.log('Event Type:', eventType);

  const signature = req.headers['x-digiflazz-signature'];
  if (!signature) {
    console.error('❌ Tidak ada signature di header');
    return res.status(401).json({ error: 'No signature provided' });
  }

  const computedSignature = crypto
    .createHmac('sha1', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (computedSignature !== signature) {
    console.error('❌ Signature tidak valid:', computedSignature, '!=', signature);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('✅ Signature valid');

  if (req.body.data) {
    const data = req.body.data;
    if (eventType === 'create') {
      console.log('📥 Create event received from Digiflazz');
      console.log('🔍 Checking ref_id_digiflazz:', data.ref_id);
      if (data.status === 'berhasil' || data.status === 'gagal') {
        console.log('✅ Status is final, saving to Supabase with ref_id_digiflazz:', data.ref_id);
        const { error } = await supabase.from('transaksi_digiflazz').insert([
          {
            ref_id_digiflazz: data.ref_id, // ref_id dari Digiflazz
            buyer_tx_id: data.buyer_tx_id,
            customer_no: data.customer_no,
            buyer_sku_code: data.buyer_sku_code,
            status: data.status,
            message: data.message,
            rc: data.rc,
            sn: data.sn || '',
            price: data.price,
            buyer_last_saldo: data.buyer_last_saldo,
            tele: data.tele,
            wa: data.wa
          }
        ]);

        if (error) {
          console.error('❌ Error saving to Supabase:', error.message);
          console.error('📛 Detailed Error:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Transaction created in Supabase');
          console.log('🧾 Data inserted:', JSON.stringify(data, null, 2));
        }
      } else {
        console.log('⏳ Transaction not saved to Supabase: Status is pending. Waiting for final status from Digiflazz.');
        console.log('📌 Data received:', JSON.stringify(data, null, 2));
        pendingTransactions.set(data.ref_id || data.buyer_tx_id, { ref_id: data.ref_id, buyer_tx_id: data.buyer_tx_id });
        pollDigiflazzStatus(data.ref_id, data.buyer_tx_id);
      }
    } else if (eventType === 'update') {
      console.log('🔁 Webhook update diterima');
      console.log('📌 Data update:', JSON.stringify(data, null, 2));
    
      if (!data.buyer_tx_id && !data.ref_id) {
        console.warn('⚠️ buyer_tx_id atau ref_id tidak ditemukan dalam webhook update:', JSON.stringify(data));
        return res.status(400).json({ error: 'Missing buyer_tx_id or ref_id' });
      }

      // Check if transaction exists in Supabase
      console.log('🔍 Checking for existing transaction in Supabase');
      console.log('🔍 Checking ref_id_digiflazz:', data.ref_id);
      let existingTransaction = null;
      if (data.buyer_tx_id) {
        const { data: txData, error } = await supabase.from('transaksi_digiflazz')
          .select('*')
          .eq('ref_id_internal', data.buyer_tx_id)
          .single();
        if (error) {
          console.error('❌ Error checking existing transaction by buyer_tx_id:', error.message);
        } else if (txData) {
          existingTransaction = txData;
          console.log('🔍 Found existing transaction by buyer_tx_id:', data.buyer_tx_id);
        }
      }
      if (!existingTransaction && data.ref_id) {
        const { data: txData, error } = await supabase.from('transaksi_digiflazz')
          .select('*')
          .eq('ref_id_digiflazz', data.ref_id)
          .single();
        if (error) {
          console.error('❌ Error checking existing transaction by ref_id:', error.message);
        } else if (txData) {
          existingTransaction = txData;
          console.log('🔍 Found existing transaction by ref_id:', data.ref_id);
        }
      }

      if (existingTransaction) {
        // Update existing transaction
        let query = supabase.from('transaksi_digiflazz').update({
          status: data.status,
          message: data.message,
          sn: data.sn || '',
          rc: data.rc,
          buyer_last_saldo: data.buyer_last_saldo,
          ref_id_digiflazz: data.ref_id // Explicitly save ref_id_digiflazz
        });

        if (data.buyer_tx_id) {
          query = query.eq('ref_id_internal', data.buyer_tx_id);
          console.log('🔍 Matching update with ref_id_internal (buyer_tx_id):', data.buyer_tx_id);
        } else if (data.ref_id) {
          query = query.eq('ref_id_digiflazz', data.ref_id);
          console.log('🔍 Matching update with ref_id_digiflazz:', data.ref_id);
        }

        const { error } = await query;
        if (error) {
          console.error('❌ Error updating Supabase:', error.message);
          console.error('📛 Detailed Error:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Transaction updated in Supabase');
          console.log('📝 Data updated:', JSON.stringify(data, null, 2));
        }
      } else {
        // Transaction not found, insert as new if status is berhasil or gagal
        if (data.status === 'berhasil' || data.status === 'gagal') {
          console.log('🆕 Transaction not found in Supabase, inserting as new since status is final');
          console.log('✅ Saving with ref_id_digiflazz:', data.ref_id);
          const { error } = await supabase.from('transaksi_digiflazz').insert([
            {
              ref_id: data.buyer_tx_id, // ref_id buatan kita
              ref_id_digiflazz: data.ref_id, // ref_id dari Digiflazz
              buyer_tx_id: data.buyer_tx_id,
              customer_no: data.customer_no || '',
              buyer_sku_code: data.buyer_sku_code || '',
              status: data.status,
              message: data.message || '',
              rc: data.rc || '',
              sn: data.sn || '',
              price: data.price || 0,
              buyer_last_saldo: data.buyer_last_saldo || 0,
              tele: data.tele || '',
              wa: data.wa || ''
            }
          ]);

          if (error) {
            console.error('❌ Error inserting new transaction to Supabase:', error.message);
            console.error('📛 Detailed Error:', JSON.stringify(error, null, 2));
          } else {
            console.log('✅ New transaction inserted into Supabase');
            console.log('🧾 Data inserted:', JSON.stringify(data, null, 2));
          }
        } else {
          console.log('⏳ Update received but status is still pending, not inserting into Supabase yet');
          console.log('📌 Data received:', JSON.stringify(data, null, 2));
        }
      }
    } else {
      console.log('⚠️ Unsupported event type:', eventType);
    }

    res.json({ success: true });
  } else {
    console.log('❌ No data in payload');
    res.status(400).json({ error: 'No data in payload' });
  }
});

// Webhook test proxy route
app.post('/api/test-webhook-proxy', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, ref_id, sign, webhook_url, webhook_id, use_ping_endpoint } = req.body;

    let endpoint = 'https://api.digiflazz.com/v1/webhook';
    if (use_ping_endpoint && webhook_id) {
      endpoint = `https://api.digiflazz.com/v1/report/hooks/${webhook_id}/pings`;
    }

    const postData = JSON.stringify({
      username,
      ref_id,
      sign,
      webhook_url
    });

    const options = {
      hostname: 'api.digiflazz.com',
      path: endpoint.replace('https://api.digiflazz.com', ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const proxyReq = http.request(options, (response) => {
      let data = '';
      response.on('data', chunk => (data += chunk));
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data || '{}');
          if (response.statusCode >= 200 && response.statusCode < 300) {
            res.status(200).json({ message: 'Webhook test successful', data: parsedData });
          } else {
            res.status(response.statusCode).json({ error: 'Failed to test webhook', details: parsedData });
          }
        } catch (err) {
          console.error('❌ Error parsing response:', err.message);
          res.status(500).json({ error: 'Invalid JSON response from Digiflazz', raw: data });
        }
      });
    });

    proxyReq.on('error', (err) => {
      console.error('❌ Error processing webhook:', err.message);
      res.status(500).json({ error: 'Request failed', detail: err.message });
    });

    proxyReq.write(postData);
    proxyReq.end();
  } catch (err) {
    console.error('❌ Error processing webhook:', err.message);
    res.status(500).json({ error: 'Request failed', detail: err.message });
  }
});

app.listen(port, '202.10.44.157', () => {
  console.log(`✅ Webhook server berjalan di http://202.10.44.157:${port}/payload`);
});
