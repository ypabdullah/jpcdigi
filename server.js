const express = require('express');
const bodyParser = require('body-parser');
const https = require('http');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 5173;
const secret = process.env.SECRET_WEBHOOK;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(bodyParser.json());

app.post('/payload', async (req, res) => {
    console.log('📩 Webhook diterima:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Raw Body:', req.body); // Log raw body in case parsing fails

    // Extract event type
    const eventType = req.body.event || 'unknown';
    console.log('Event Type:', eventType);

    // Verify webhook signature
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

    // Save to Supabase database based on event type
    if (req.body.data) {
        const data = req.body.data;
        console.log('Data to save:', data);
        
        if (data && eventType) {
            console.log('📩 Event diterima:', eventType);
            console.log('📋 Data:', JSON.stringify(data, null, 2));

            if (eventType === 'create') {
                const { error } = await supabase
                    .from('transaksi_digiflazz')
                    .insert([
                        {
                            ref_id: data.ref_id || data.buyer_tx_id,
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
                } else {
                    console.log('✅ Transaction created in Supabase');
                }
            } else if (eventType === 'update') {
                console.log('🔁 Webhook update diterima');
                console.log('📌 Data update:', JSON.stringify(data, null, 2));

                if (!data.buyer_tx_id && !data.ref_id) {
                    console.warn('⚠️ buyer_tx_id atau ref_id tidak ditemukan dalam webhook update:', JSON.stringify(data));
                    return res.status(400).json({ error: 'Missing buyer_tx_id or ref_id' });
                }

                // Try to update based on buyer_tx_id or ref_id
                let query = supabase.from('transaksi_digiflazz').update({
                    status: data.status,
                    message: data.message,
                    sn: data.sn || '',
                    rc: data.rc,
                    buyer_last_saldo: data.buyer_last_saldo,
                });

                // Use buyer_tx_id if available, otherwise ref_id
                if (data.buyer_tx_id) {
                    query = query.eq('ref_id', data.buyer_tx_id);
                    console.log('🔍 Matching update with buyer_tx_id:', data.buyer_tx_id);
                } else if (data.ref_id) {
                    query = query.eq('ref_id', data.ref_id);
                    console.log('🔍 Matching update with ref_id:', data.ref_id);
                }

                const { error } = await query;
                
                if (error) {
                    console.error('❌ Error updating Supabase:', error.message);
                } else {
                    console.log('✅ Transaction updated in Supabase');
                    console.log('🔁 Matching: ref_id (local) vs buyer_tx_id or ref_id (Digiflazz):', data.buyer_tx_id || data.ref_id);
                }
            } else {
                console.log('⚠️ Unsupported event type:', eventType);
            }
        } else {
            console.log('❌ No data field in webhook payload. Full payload:', JSON.stringify(req.body, null, 2));
        }

        res.json({ success: true });
    }
});

// Webhook test proxy endpoint for Digiflazz
const webhookTestProxy = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, ref_id, sign, webhook_url, webhook_id, use_ping_endpoint } = req.body;
    console.log('Webhook test proxy request received:', { username, ref_id, webhook_url, webhook_id, use_ping_endpoint });

    // Determine which endpoint to use
    let endpoint = 'https://api.digiflazz.com/v1/webhook-test';
    if (use_ping_endpoint && webhook_id) {
      endpoint = `https://api.digiflazz.com/v1/report/hooks/${webhook_id}/pings`;
    }
    
    // Forward the request to Digiflazz webhook test or ping endpoint
    console.log(`Forwarding request to Digiflazz endpoint: ${endpoint}`);
    
    // Prepare the request data
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
    
    // Make the request using https module
    const request = https.request(options, (response) => {
      console.log('Response received from Digiflazz:', response.statusCode, response.statusMessage);
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log('Raw response text:', data);
        let parsedData;
        try {
          parsedData = data ? JSON.parse(data) : { message: 'No response content from Digiflazz' };
        } catch (e) {
          console.error('Error parsing JSON response:', e);
          parsedData = { error: 'Invalid JSON response from Digiflazz', rawResponse: data };
        }
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          console.log('Webhook test successful:', parsedData);
          res.status(200).json({ message: 'Webhook test successful', data: parsedData });
        } else {
          console.error('Webhook test failed with status:', response.statusCode, parsedData);
          res.status(response.statusCode).json({ error: parsedData.error || 'Failed to test webhook', details: parsedData });
        }
      });
    });
    
    request.on('error', (error) => {
      console.error('Error proxying webhook test request:', error);
      res.status(500).json({ error: `Failed to proxy webhook test request: ${error.message}` });
    });
    
    // Send the request data
    request.write(postData);
    request.end();
  } catch (error) {
    console.error('Error proxying webhook test request:', error);
    res.status(500).json({ error: `Failed to proxy webhook test request: ${error.message}` });
  }
};

// Add the webhook test proxy route
app.post('/api/test-webhook-proxy', webhookTestProxy);

app.listen(port, () => {
    console.log(`✅ Webhook server berjalan di http://202.10.44.157:${port}/payload`);
});
