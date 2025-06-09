import express from 'express';
import bodyParser from 'body-parser';
import http from 'http'; // Tetap http, bukan https
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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
      const { error } = await supabase.from('transaksi_digiflazz').insert([
        {
          ref_id: data.buyer_tx_id, // ref_id buatan kita
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
      } else {
        console.log('✅ Transaction created in Supabase');
        console.log('🧾 Data inserted:', JSON.stringify(insertedData, null, 2));
      }

    } else if (eventType === 'update') {
        console.log('🔁 Webhook update diterima');
        console.log('📌 Data update:', JSON.stringify(data, null, 2));
    
        if (!data.buyer_tx_id && !data.ref_id) {
            console.warn('⚠️ buyer_tx_id atau ref_id tidak ditemukan dalam webhook update:', JSON.stringify(data));
            return res.status(400).json({ error: 'Missing buyer_tx_id or ref_id' });
        }

      let query = supabase.from('transaksi_digiflazz').update({
        status: data.status,
        message: data.message,
        sn: data.sn || '',
        rc: data.rc,
        buyer_last_saldo: data.buyer_last_saldo,
      });

      if (data.buyer_tx_id) {
        query = query.eq('ref_id_internal', data.buyer_tx_id);
        console.log('🔍 Matching update with ref_id_internal (buyer_tx_id):', data.buyer_tx_id);
    } else if (data.ref_id) {
        query = query.eq('ref_id_digiflazz', data.ref_id);
        console.log('🔍 Matching update with ref_id_digiflazz:', data.ref_id)

      const { error } = await query;
      if (error) {
        console.error('❌ Error updating Supabase:', error.message);
      } else {
        console.log('✅ Transaction updated in Supabase');
        console.log('📝 Data updated:', JSON.stringify(updatedData, null, 2));
      }
    } else {
      console.log('⚠️ Unsupported event type:', eventType);
    }

    res.json({ success: true });
  } else {
    console.log('❌ No data in payload');
    res.status(400).json({ error: 'No data in payload' });
  }


// Webhook test proxy route
app.post('/api/test-webhook-proxy', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, ref_id, sign, webhook_url, webhook_id, use_ping_endpoint } = req.body;

    let endpoint = 'https://api.digiflazz.com/v1/webhook-test';
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
          res.status(500).json({ error: 'Invalid JSON response from Digiflazz', raw: data });
        }
      });
    });

    proxyReq.on('error', (err) => {
      res.status(500).json({ error: 'Request failed', detail: err.message });
    });

    proxyReq.write(postData);
    proxyReq.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Webhook server berjalan di http://0.0.0.0:${port}/payload`);
  });
  
